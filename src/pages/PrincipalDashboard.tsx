import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Bar,
    Tooltip,
    Legend,
    Cell
} from 'recharts';
import '../styles/principaldashboard/PrincipalDashboard.css';
import { useAuthStore } from '../store/authStore';

// Declare global jsPDF and html2canvas if loaded via CDN
declare const html2canvas: any;
declare const jspdf: any;

// Interface for user data received from Django API.
interface DjangoUserData {
    name: string;
    role: string;
}

// Interface for individual late arrival records from Django API.
interface DjangoLateArrival {
    student_name: string;
    department: string;
    batch: string; // Batch is a string like "U5DS2024"
    ugpg: string; // UG/PG status
    timestamp: string;
}

// Interface for the complete Principal Dashboard data from Django API.
interface PrincipalDashboardDjangoData {
    user: DjangoUserData;
    late_arrivals: DjangoLateArrival[];
}

// Utility function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Separate component for RecentLateEntries for better code organization
const RecentLateEntries: React.FC<{ entries: DjangoLateArrival[], filterMode: string, totalLatecomers: number }> = ({ entries, filterMode }) => {
    const formatTimestamp = (isoString: string) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const displayTableRows = () => {
        // Mode: 'weekly', 'monthly', or 'specificDate' (where count > 1 is possible)
        if (filterMode !== 'currentDay') {
            const studentPeriodCounts = new Map<string, { count: number; batch: string; ugpg: string; department: string }>();
            entries.forEach(entry => {
                const key = entry.student_name;
                studentPeriodCounts.set(key, {
                    count: (studentPeriodCounts.get(key)?.count || 0) + 1,
                    batch: entry.batch,
                    ugpg: entry.ugpg,
                    department: entry.department,
                });
            });
            return Array.from(studentPeriodCounts.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .map(([name, data]) => (
                    <tr key={name}>
                        <td data-label="Student Name">{name}</td>
                        <td data-label="Department">{data.department}</td>
                        <td data-label="Batch">{data.batch}</td>
                        <td data-label="UG/PG">{data.ugpg}</td>
                        {/* LATE COUNT is displayed here */}
                        <td data-label="Late Count">{data.count}</td>
                    </tr>
                ));
        } else {
            // Mode: 'currentDay'
            return entries.map((entry, index) => (
                <tr key={index}>
                    <td data-label="Student Name">{entry.student_name}</td>
                    <td data-label="Department">{entry.department}</td>
                    <td data-label="Batch">{entry.batch}</td>
                    <td data-label="UG/PG">{entry.ugpg}</td>
                    {/* LATE ARRIVAL TIME is displayed here */}
                    <td data-label="Late Arrival Time">{formatTimestamp(entry.timestamp)}</td>
                    {/* LATE COUNT COLUMN IS OMITTED HERE */}
                </tr>
            ));
        }
    };

    const handlePrintPdf = async () => {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            console.error("html2canvas or jspdf library not loaded.");
            alert("PDF generation libraries not loaded. Please ensure internet connectivity or check script tags.");
            return;
        }

        const input = document.getElementById('recent-late-entries-table-section');
        if (!input) {
            console.error("Table section not found for PDF generation.");
            alert("Could not find the table to generate PDF.");
            return;
        }

        const originalOverflow = input.style.overflow;
        input.style.overflow = 'visible';

        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const imgWidth = 595;
            const pageHeight = 842;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Recent_Late_Entries_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            input.style.overflow = originalOverflow;
        }
    };

    // Determine which columns to show in the header
    const showLateArrivalTime = filterMode === 'currentDay';
    const showLateCount = filterMode !== 'currentDay';


    return (
        <section className="recent-latecomers-section">
            <h3 className="section-title">Recent Late Entries ({filterMode === 'currentDay' ? 'Today' : 'This Period'})</h3>
            <div className="header-actions" style={{ marginBottom: '15px' }}>
                <button
                    onClick={handlePrintPdf}
                    className="download-pdf-button"
                >
                    Download as PDF
                </button>
            </div>
            <div id="recent-late-entries-table-section" className="recent-entries-table-container">
                {entries.length > 0 ? (
                    <table className="recent-latecomers-table">
                        <thead>
                            <tr>
                                <th>STUDENT NAME</th>
                                <th>DEPARTMENT</th>
                                <th>BATCH</th>
                                <th>UG/PG</th>
                                {/* Conditionally display LATE ARRIVAL TIME */}
                                {showLateArrivalTime && <th>LATE ARRIVAL TIME</th>}
                                {/* Conditionally display LATE COUNT (only for weekly/monthly/specific date) */}
                                {showLateCount && <th>LATE COUNT</th>}
                            </tr>
                        </thead>
                        <tbody>{displayTableRows()}</tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No recent late entries available for this period.</p>
                )}
            </div>
        </section>
    );
};

// ***************************************************************
// ** DYNAMIC ABBREVIATION FUNCTION (NO HARDCODING) **
// ***************************************************************
const shortenDepartmentName = (name: string): string => {
    const trimmedName = name.trim();

    // Split by any space or hyphen to correctly handle multi-word names
    const words = trimmedName.split(/[\s-]+/).filter(w => w.length > 0);

    // 1. DYNAMIC INITIALS: Use initials for ALL multi-word names (e.g., "Data Science" -> "DS")
    if (words.length > 1) {
        const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
        // Limit initials length to prevent overlap
        return initials.length <= 5 ? initials : initials.substring(0, 5);
    }

    // 2. STRICT TRUNCATION: If it's a single word and over 5 characters, truncate to first 3 + '.'
    const MAX_LENGTH_BEFORE_TRUNCATE = 5;
    if (trimmedName.length > MAX_LENGTH_BEFORE_TRUNCATE) {
        // Truncate to the first 3 characters and append a period.
        return trimmedName.substring(0, 3) + '.';
    }

    // Default: return the original name (it's short enough, e.g., "Math" or "Arts")
    return trimmedName;
};

// ***************************************************************
// ** END OF DYNAMIC FUNCTION **
// ***************************************************************


const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, logout } = useAuthStore();

    const [filterMode, setFilterMode] = useState<string>('currentDay');
    const [specificDate, setSpecificDate] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [departments, setDepartments] = useState<string[]>(['All']);

    const [selectedUgPg, setSelectedUgPg] = useState<string | 'All'>('All');
    const [ugpgOptions, setUgPgOptions] = useState<(string | 'All')[]>(['All']);

    const [principalDashboardDjangoData, setPrincipalDashboardDjangoData] = useState<PrincipalDashboardDjangoData | null>(null);
    const [isLoadingPrincipalDashboardDjangoData, setIsLoadingPrincipalDashboardDjangoData] = useState(true);
    const [errorPrincipalDashboardDjango, setErrorPrincipalDashboardDjango] = useState<string | null>(null);

    const formatDateToISO = (date: Date): string => date.toISOString().split('T')[0];

    const getStartOfWeek = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const getEndOfWeek = (date: Date): Date => {
        const d = new Date(getStartOfWeek(date));
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const getStartOfMonth = (date: Date): Date => {
        const d = new Date(date.getFullYear(), date.getMonth(), 1);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const getEndOfMonth = (date: Date): Date => {
        const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const handleFilterModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const mode = event.target.value;
        setFilterMode(mode);
        const now = new Date();
        if (mode === 'currentDay') {
            setSpecificDate('');
            setStartDate('');
            setEndDate('');
        } else if (mode === 'weekly') {
            setStartDate(formatDateToISO(getStartOfWeek(now)));
            setEndDate(formatDateToISO(getEndOfWeek(now)));
            setSpecificDate('');
        } else if (mode === 'monthly') {
            setStartDate(formatDateToISO(getStartOfMonth(now)));
            setEndDate(formatDateToISO(getEndOfMonth(now)));
            setSpecificDate('');
        } else if (mode === 'specificDate') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleSpecificDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSpecificDate(event.target.value);
        setFilterMode('specificDate');
        setStartDate('');
        setEndDate('');
    };

    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(event.target.value);
    };

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(event.target.value);
    };

    const handleUgPgChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUgPg(event.target.value);
    };

    const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedDepartment(selectedValue);

        if (selectedValue !== 'All') {
            if (principalDashboardDjangoData) {
                const urlSafeDepartment = encodeURIComponent(selectedValue.toLowerCase().replace(/\s/g, '-'));
                navigate(`/department-dashboard/${urlSafeDepartment}`, {
                    state: {
                        allLateArrivalsData: principalDashboardDjangoData?.late_arrivals,
                        filterDateInfo: {
                            mode: filterMode,
                            specificDate: specificDate,
                            startDate: startDate,
                            endDate: endDate
                        },
                        selectedUgPg: selectedUgPg
                    }
                });
            }
        }
    };

    const handleBarClick = (data: any) => {
        const department = data.department;
        const urlSafeDepartment = encodeURIComponent(department.toLowerCase().replace(/\s/g, '-'));
        navigate(`/department-dashboard/${urlSafeDepartment}`, {
            state: {
                allLateArrivalsData: principalDashboardDjangoData?.late_arrivals,
                filterDateInfo: {
                    mode: filterMode,
                    specificDate: specificDate,
                    startDate: startDate,
                    endDate: endDate
                },
                selectedUgPg: selectedUgPg
            }
        });
    };

    useEffect(() => {
        if (!isAuthenticated) {
            console.warn("User not authenticated, redirecting to login.");
            navigate('/login');
            return;
        }
        if (user && user.role !== 'Principal') {
            console.warn(`User with role ${user.role} attempted to access Principal Dashboard. Redirecting.`);
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        const fetchPrincipalDashboardDjangoData = async () => {
            if (!isAuthenticated || !token) {
                setIsLoadingPrincipalDashboardDjangoData(false);
                setErrorPrincipalDashboardDjango('Authentication required to fetch data.');
                return;
            }

            setIsLoadingPrincipalDashboardDjangoData(true);
            setErrorPrincipalDashboardDjango(null);

            try {
                const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'https://scanbyte-backend.onrender.com/api';
                const endpoint = `${API_BASE_URL_DJANGO}/principal-dashboard/`;
                console.log("Fetching from endpoint:", endpoint);

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                console.log("API Response Status:", response.status);

                if (!response.ok) {
                    let errorMessage = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
                            errorMessage = errorData.detail;
                        } else {
                            errorMessage = `API error: ${JSON.stringify(errorData)}`;
                        }
                    } catch (jsonError) {
                        errorMessage = `Failed to parse API error response. Status: ${response.status}. Please check backend logs.`;
                        console.error("JSON parsing error on non-OK response:", jsonError);
                    }
                    throw new Error(errorMessage);
                }

                const data: PrincipalDashboardDjangoData = await response.json();
                console.log("Successfully fetched Django data:", data);
                setPrincipalDashboardDjangoData(data);

                // Dynamically populate departments from API data
                const uniqueDepartments = Array.from(new Set(data.late_arrivals.map(arrival => arrival.department)));
                setDepartments(['All', ...uniqueDepartments]);

                const uniqueUgPg = Array.from(new Set(data.late_arrivals.map(arrival => arrival.ugpg)));
                setUgPgOptions(['All', ...uniqueUgPg.sort((a, b) => String(a).localeCompare(String(b)))]);

                const now = new Date();
                if (filterMode === 'currentDay') {
                } else if (filterMode === 'weekly') {
                    setStartDate(formatDateToISO(getStartOfWeek(now)));
                    setEndDate(formatDateToISO(getEndOfWeek(now)));
                } else if (filterMode === 'monthly') {
                    setStartDate(formatDateToISO(getStartOfMonth(now)));
                    setEndDate(formatDateToISO(getEndOfMonth(now)));
                }

            } catch (err: any) {
                console.error("Error fetching Principal Dashboard Django data:", err);
                setErrorPrincipalDashboardDjango(err.message || 'An unexpected error occurred while fetching Django data.');
            } finally {
                setIsLoadingPrincipalDashboardDjangoData(false);
            }
        };

        if (isAuthenticated && token) {
            fetchPrincipalDashboardDjangoData();
        }
    }, [isAuthenticated, token, navigate]);

    if (errorPrincipalDashboardDjango) {
        return (
            <div className="principal-dashboard flex items-center justify-center min-h-screen">
                <p className="error-message">Error: {errorPrincipalDashboardDjango}</p>
            </div>
        );
    }

    const filterLateArrivals = (arrivals: DjangoLateArrival[]) => {
        const startFilterDate = startDate ? new Date(startDate) : null;
        const endFilterDate = endDate ? new Date(endDate) : null;

        return arrivals.filter(arrival => {
            const arrivalDateTime = new Date(arrival.timestamp);
            const arrivalDateOnlyISO = formatDateToISO(arrivalDateTime);

            let isWithinDateRange = false;
            if (filterMode === 'currentDay') {
                const latestDashboardDate = arrivals.reduce((latest, current) => {
                    const currentDate = new Date(current.timestamp);
                    return latest && latest.getTime() > currentDate.getTime() ? latest : currentDate;
                }, new Date(0));
                const latestDashboardDateISO = latestDashboardDate ? formatDateToISO(latestDashboardDate) : '';
                isWithinDateRange = arrivalDateOnlyISO === latestDashboardDateISO;
            } else if (filterMode === 'specificDate' && specificDate) {
                isWithinDateRange = arrivalDateOnlyISO === specificDate;
            } else if ((filterMode === 'weekly' || filterMode === 'monthly') && startFilterDate && endFilterDate) {
                const adjustedEndFilterDate = new Date(endFilterDate);
                adjustedEndFilterDate.setHours(23, 59, 59, 999);
                isWithinDateRange = arrivalDateTime >= startFilterDate && arrivalDateTime <= adjustedEndFilterDate;
            }

            const isWithinDepartment = selectedDepartment === 'All' ||
                arrival.department.toLowerCase().trim() === selectedDepartment.toLowerCase().trim();

            const isWithinUgPg = selectedUgPg === 'All' || arrival.ugpg === selectedUgPg;

            return isWithinDateRange && isWithinDepartment && isWithinUgPg;
        });
    };

    const filteredLateArrivals = principalDashboardDjangoData?.late_arrivals
        ? filterLateArrivals(principalDashboardDjangoData.late_arrivals)
        : [];

    const lateStudentsCount = filteredLateArrivals.length;

    // ***************************************************************
    // ** UPDATED FUNCTION: Sorts by count (desc) and ensures a Top 10 list (filling with random empty deps) **
    // ***************************************************************
    const departmentLatecomersData = () => {
        const allDepartmentNames = departments.filter(d => d !== 'All');
        const departmentCounts: { [key: string]: number } = {};

        // 1. COLLECT: Initialize counts for all departments and count latecomers
        allDepartmentNames.forEach(dept => {
            departmentCounts[dept] = 0;
        });

        filteredLateArrivals.forEach(arrival => {
            const departmentName = arrival.department;
            if (departmentCounts.hasOwnProperty(departmentName)) {
                departmentCounts[departmentName]++;
            }
        });

        // Convert the map to an array of objects
        let data = Object.keys(departmentCounts).map(dept => ({
            department: dept,
            latecomers: departmentCounts[dept],
        }));

        // Separate departments into non-empty and empty lists
        let nonZeroData = data.filter(d => d.latecomers > 0);
        let zeroData = data.filter(d => d.latecomers === 0);

        // 2. SORT NON-ZERO: Sort by latecomers count in descending order
        nonZeroData.sort((a, b) => b.latecomers - a.latecomers);

        const MAX_DEPARTMENTS_TO_DISPLAY = 10;

        if (nonZeroData.length >= MAX_DEPARTMENTS_TO_DISPLAY) {
            // If there are 10 or more departments with latecomers, just show the top 10
            return nonZeroData.slice(0, MAX_DEPARTMENTS_TO_DISPLAY);
        }

        // 3. SHUFFLE EMPTY: If we need to fill the remaining spots, shuffle the zero-count departments
        const requiredEmptySpots = MAX_DEPARTMENTS_TO_DISPLAY - nonZeroData.length;
        const shuffledZeroData = shuffleArray(zeroData);

        // 4. COMBINE & LIMIT: Take the necessary number of shuffled empty departments
        const fillerData = shuffledZeroData.slice(0, requiredEmptySpots);

        // Combine the top departments and the random filler departments
        return [...nonZeroData, ...fillerData];
    };
    // ***************************************************************

    const getDisplayDateInfo = (): string => {
        if (filterMode === 'currentDay') {
            const latestTimestamp = principalDashboardDjangoData?.late_arrivals.reduce((latest, arrival) => {
                const arrivalDate = new Date(arrival.timestamp);
                return latest && latest.getTime() > arrivalDate.getTime() ? latest : arrivalDate;
            }, new Date(0));
            return latestTimestamp ? formatDateToISO(latestTimestamp) : 'Today';
        } else if (filterMode === 'specificDate' && specificDate) {
            return specificDate;
        } else if (filterMode === 'weekly' && startDate && endDate) {
            return `${startDate} to ${endDate}`;
        } else if (filterMode === 'monthly' && startDate && endDate) {
            const month = new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            return `Month of ${month}`;
        }
        return 'Today';
    };

    const recentLateEntriesForDisplay = () => {
        const sortedEntries = [...filteredLateArrivals]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return sortedEntries;
    };


    const PASTEL_COLORS = [
        '#AEC6CF', // Powder Blue
        '#B3E0C9', // Mint Green
        '#FDD49E', // Peach
        '#E6B3B3', // Dusty Rose
        '#C2B2D8', // Light Lavender
        '#D5F0F6', // Sky Blue Light
        '#D0E0E3', // Light Grey Blue
        '#F6E8DA', // Creamy Beige
        '#FAD2E1', // Pale Pink
        '#C7E9B0', // Light Chartreuse
        '#A7D9D9', // Soft Teal
        '#FFE0B2', // Pale Orange
        '#D1C4E9', // Light Purple
        '#BBDEFB', // Light Blue
        '#F8BBD0'  // Light Rose
    ];

    return (
        <div className="principal-dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Principal Dashboard</h1>
                <div className="header-actions">
                    <span className="header-welcome-text">Welcome Sir</span>
                    <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 ease-in-out">
                        BACK
                    </button>
                </div>
            </header>

            <section className="dashboard-filters">
                <div className="filter-box">
                    <label htmlFor="date-filter-mode">Filter By</label>
                    <select id="date-filter-mode" onChange={handleFilterModeChange} value={filterMode}>
                        <option value="currentDay">Current Day</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="specificDate">Specific Date</option>
                    </select>
                </div>
                {(filterMode === 'specificDate') && (
                    <div className="filter-box">
                        <label htmlFor="specific-date">Select Date</label>
                        <input
                            id="specific-date"
                            type="date"
                            value={specificDate || ''}
                            onChange={handleSpecificDateChange}
                        />
                    </div>
                )}
                {(filterMode === 'weekly' || filterMode === 'monthly') && (
                    <>
                        <div className="filter-box">
                            <label htmlFor="start-date">From Date</label>
                            <input
                                id="start-date"
                                type="date"
                                value={startDate || ''}
                                onChange={handleStartDateChange}
                            />
                        </div>
                        <div className="filter-box">
                            <label htmlFor="end-date">To Date</label>
                            <input
                                id="end-date"
                                type="date"
                                value={endDate || ''}
                                onChange={handleEndDateChange}
                            />
                        </div>
                    </>
                )}
                <div className="filter-box">
                    <label htmlFor="departments">Departments</label>
                    <select id="departments" onChange={handleDepartmentChange} value={selectedDepartment}>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-box">
                    <label htmlFor="ugpg-filter">UG/PG</label>
                    <select id="ugpg-filter" onChange={handleUgPgChange} value={selectedUgPg}>
                        {ugpgOptions.map(option => (
                            <option key={option} value={option}>
                                {option === 'All' ? 'All' : option}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {isLoadingPrincipalDashboardDjangoData ? (
                <p className="loading-message">Loading dashboard data...</p>
            ) : (
                <div className="dashboard-main-grid">
                    {/* TOTAL LATECOMERS SUMMARY CARD - KEPT */}
                    <div className="summary-card-container">
                        <section className="summary-card">
                            <h3 className="card-label">Total Latecomers <br/>({getDisplayDateInfo()})</h3>
                            <p className="card-value">{lateStudentsCount}</p>
                        </section>
                    </div>

                    <div className="chart-section-container">
                        <section className="dashboard-chart-section">
                            <h3 className="section-title">Department Latecomers</h3>
                            <div className="chart-container-bar">
                                <ResponsiveContainer width="100%" height={250}>
                                    {departmentLatecomersData().length > 0 ? (
                                        <BarChart
                                            data={departmentLatecomersData()}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="department"
                                                tickFormatter={shortenDepartmentName}
                                                height={50}
                                                // Ensures ALL ticks are displayed
                                                interval={0}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="latecomers" name="Latecomers" onClick={handleBarClick}>
                                                {
                                                    departmentLatecomersData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                                                    ))
                                                }
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <div className="recharts-empty-message">
                                            <p className="no-data-message">No department data available within the selected date range.</p>
                                        </div>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>

                    <div className="recent-entries-section-container">
                        <RecentLateEntries entries={recentLateEntriesForDisplay()} filterMode={filterMode} totalLatecomers={lateStudentsCount} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrincipalDashboard;