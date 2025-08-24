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
    Legend
} from 'recharts';
import '../styles/principaldashboard/PrincipalDashboard.css';
import { useAuthStore } from '../store/authStore';

// IMPORTANT: Include jsPDF and html2canvas CDN scripts
// These scripts are necessary for PDF generation from HTML content.
// Ensure these are loaded in your HTML file or globally accessible.
// For example, you might add them in your public/index.html <head> or similar:
/*
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
*/

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
    ugpg: string; // <-- ADDED: UG/PG status
    timestamp: string;
}

// Interface for the complete Principal Dashboard data from Django API.
interface PrincipalDashboardDjangoData {
    user: DjangoUserData;
    late_arrivals: DjangoLateArrival[];
}

// Separate component for RecentLateEntries for better code organization
const RecentLateEntries: React.FC<{ entries: DjangoLateArrival[], filterMode: string }> = ({ entries, filterMode }) => {
    const formatTimestamp = (isoString: string) => {
        if (!isoString) return 'N/A'; // Handle cases where timestamp might be missing
        const date = new Date(isoString);
        // Using 'en-IN' locale for 'hh:mm AM/PM' format
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const displayTableRows = () => {
        if (filterMode === 'monthly') {
            // For monthly mode, group by student and show total late count for the period
            const studentMonthlyCounts = new Map<string, { count: number; batch: string; ugpg: string }>(); // ugpg added
            entries.forEach(entry => {
                const key = entry.student_name;
                studentMonthlyCounts.set(key, {
                    count: (studentMonthlyCounts.get(key)?.count || 0) + 1,
                    batch: entry.batch,
                    ugpg: entry.ugpg, // Store ugpg here
                });
            });
            // Sort by highest late count
            return Array.from(studentMonthlyCounts.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .map(([name, data]) => (
                    <tr key={name}>
                        <td data-label="Student Name">{name}</td>
                        <td data-label="Batch">{data.batch}</td>
                        <td data-label="UG/PG">{data.ugpg}</td> {/* Display UG/PG */}
                        <td data-label="Late Arrival Time">N/A</td> {/* Late arrival time is not applicable for monthly aggregate */}
                        <td data-label="Late Count">{data.count}</td>
                    </tr>
                ));
        } else {
            // For currentDay, weekly, specificDate, show individual late entries
            return entries.map((entry, index) => (
                <tr key={index}>
                    <td data-label="Student Name">{entry.student_name}</td>
                    <td data-label="Batch">{entry.batch}</td>
                    <td data-label="UG/PG">{entry.ugpg}</td> {/* Display UG/PG */}
                    <td data-label="Late Arrival Time">{formatTimestamp(entry.timestamp)}</td>
                    <td data-label="Late Count">1</td> {/* Each individual entry is one late count */}
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

        // Temporarily adjust styles for better PDF output if needed (e.g., remove scrollbars)
        const originalOverflow = input.style.overflow;
        input.style.overflow = 'visible'; // Make content fully visible for capture

        try {
            const canvas = await html2canvas(input, {
                scale: 2, // Increase scale for better resolution in PDF
                useCORS: true, // If you have external images or fonts, enable CORS
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'pt', // Use points for unit
                format: 'a4'
            });

            const imgWidth = 595; // A4 width in pt (approx)
            const pageHeight = 842; // A4 height in pt (approx)
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
            // Restore original styles
            input.style.overflow = originalOverflow;
        }
    };

    return (
        <section className="recent-latecomers-section">
            <h3 className="section-title">Recent Late Entries ({filterMode === 'currentDay' ? 'Today' : 'This Period'})</h3>
            <div className="header-actions" style={{ marginBottom: '15px' }}>
                <button
                    onClick={handlePrintPdf}
                    className="download-pdf-button" // Using the class for greyscale styling
                >
                    Download as PDF
                </button>
            </div>
            <div id="recent-late-entries-table-section" className="recent-entries-table-container"> {/* Added ID for PDF generation */}
                {entries.length > 0 ? (
                    <table className="recent-latecomers-table">
                        <thead>
                            <tr>
                                <th>STUDENT NAME</th>
                                <th>BATCH</th>
                                <th>UG/PG</th> {/* ADDED: New header for UG/PG */}
                                <th>LATE ARRIVAL TIME</th>
                                <th>LATE COUNT</th>
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

const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, logout } = useAuthStore();

    const [filterMode, setFilterMode] = useState<string>('currentDay');
    const [specificDate, setSpecificDate] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [departments, setDepartments] = useState<string[]>(['All']);
    // REMOVED: selectedBatch
    // REMOVED: batches

    // ADDED: State for UG/PG filter
    const [selectedUgPg, setSelectedUgPg] = useState<string | 'All'>('All');
    const [ugpgOptions, setUgPgOptions] = useState<(string | 'All')[]>(['All']);

    const [principalDashboardDjangoData, setPrincipalDashboardDjangoData] = useState<PrincipalDashboardDjangoData | null>(null);
    const [isLoadingPrincipalDashboardDjangoData, setIsLoadingPrincipalDashboardDjangoData] = useState(true);
    const [errorPrincipalDashboardDjango, setErrorPrincipalDashboardDjango] = useState<string | null>(null);

    // Helper to format date to YYYY-MM-DD
    const formatDateToISO = (date: Date): string => date.toISOString().split('T')[0];

    // Helper to get start of the week (Sunday)
    const getStartOfWeek = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // Helper to get end of the week (Saturday)
    const getEndOfWeek = (date: Date): Date => {
        const d = new Date(getStartOfWeek(date));
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    // Helper to get start of the month
    const getStartOfMonth = (date: Date): Date => {
        const d = new Date(date.getFullYear(), date.getMonth(), 1);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // Helper to get end of the month
    const getEndOfMonth = (date: Date): Date => {
        const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        d.setHours(23, 59, 59, 999);
        return d;
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

                const uniqueDepartments = Array.from(new Set(data.late_arrivals.map(arrival => arrival.department)));
                setDepartments(['All', ...uniqueDepartments]);

                // REMOVED: Batch specific logic
                // ADDED: UG/PG specific logic
                const uniqueUgPg = Array.from(new Set(data.late_arrivals.map(arrival => arrival.ugpg)));
                setUgPgOptions(['All', ...uniqueUgPg.sort((a, b) => String(a).localeCompare(String(b)))]);


                const now = new Date();
                if (filterMode === 'currentDay') {
                    // No need to set specificDate, filterLateArrivals will get it dynamically
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
        setFilterMode('specificDate'); // Set mode explicitly when date is picked
        setStartDate('');
        setEndDate('');
    };

    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(event.target.value);
    };

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(event.target.value);
    };

    // REMOVED: handleBatchChange

    // ADDED: Handler for UG/PG filter change
    const handleUgPgChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUgPg(event.target.value);
    };

    const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedDepartment(selectedValue);

        if (selectedValue !== 'All') {
            if (principalDashboardDjangoData) {
                const urlSafeDepartment = encodeURIComponent(selectedValue.toLowerCase().replace(/\s/g, '-')); // Corrected
                navigate(`/department-dashboard/${urlSafeDepartment}`, {
                    state: {
                        allLateArrivalsData: principalDashboardDjangoData?.late_arrivals,
                        filterDateInfo: {
                            mode: filterMode,
                            specificDate: specificDate,
                            startDate: startDate,
                            endDate: endDate
                        },
                        selectedUgPg: selectedUgPg // <-- CHANGED: Pass selectedUgPg instead of selectedBatch
                    }
                });
            }
        }
    };

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
                // Adjust endFilterDate to include the entire end day
                const adjustedEndFilterDate = new Date(endFilterDate);
                adjustedEndFilterDate.setHours(23, 59, 59, 999);
                isWithinDateRange = arrivalDateTime >= startFilterDate && arrivalDateTime <= adjustedEndFilterDate;
            }

            const isWithinDepartment = selectedDepartment === 'All' ||
                arrival.department.toLowerCase().trim() === selectedDepartment.toLowerCase().trim();

            // CHANGED: UG/PG filter logic instead of Batch filter
            const isWithinUgPg = selectedUgPg === 'All' || arrival.ugpg === selectedUgPg;
            
            // Debugging console logs - uncomment to re-enable
            // console.log(`UG/PG Filter Debug: Student: ${arrival.student_name}, Arrival UG/PG: ${arrival.ugpg} (type: ${typeof arrival.ugpg}), Selected UG/PG: ${selectedUgPg} (type: ${typeof selectedUgPg}), Is Within UG/PG: ${isWithinUgPg}, Date Pass: ${isWithinDateRange}, Dept Pass: ${isWithinDepartment}`);

            return isWithinDateRange && isWithinDepartment && isWithinUgPg;
        });
    };

    const filteredLateArrivals = principalDashboardDjangoData?.late_arrivals
        ? filterLateArrivals(principalDashboardDjangoData.late_arrivals)
        : [];

    const lateStudentsCount = filteredLateArrivals.length;

    const departmentLatecomersData = () => {
        const departmentCounts: { [key: string]: number } = {};
        // Initialize counts for all departments fetched, excluding 'All'
        departments.filter(d => d !== 'All').forEach(dept => {
            departmentCounts[dept] = 0;
        });

        filteredLateArrivals.forEach(arrival => {
            const departmentName = arrival.department;
            if (departmentCounts.hasOwnProperty(departmentName)) {
                departmentCounts[departmentName]++;
            }
        });

        return Object.keys(departmentCounts).map(dept => ({
            department: dept,
            latecomers: departmentCounts[dept],
        }));
    };

    const recentLateEntriesForDisplay = () => {
        // Sort the entries to show the most recent first
        const sortedEntries = [...filteredLateArrivals]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Return the sorted entries, the RecentLateEntries component will handle the display format
        return sortedEntries;
    };


    const handleBarClick = (data: any, index: number) => {
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
                selectedUgPg: selectedUgPg // <-- CHANGED: Pass selectedUgPg instead of selectedBatch
            }
        });
    };

    if (isLoadingPrincipalDashboardDjangoData) {
        return (
            <div className="principal-dashboard flex items-center justify-center min-h-screen">
                <p className="loading-message">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="principal-dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Principal Dashboard</h1>
                <div className="header-actions">
                    {/* Display user name or role if available, or a generic welcome */}
                    <span className="text-gray-700 font-medium mr-4">Welcome Sir</span>
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
                            value={specificDate || ''} // Ensure value is never NaN or undefined
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
                                value={startDate || ''} // Ensure value is never NaN or undefined
                                onChange={handleStartDateChange}
                            />
                        </div>
                        <div className="filter-box">
                            <label htmlFor="end-date">To Date</label>
                            <input
                                id="end-date"
                                type="date"
                                value={endDate || ''} // Ensure value is never NaN or undefined
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
                {/* CHANGED: Replaced Batch filter with UG/PG filter */}
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
                    {/* First section: Total Latecomers card */}
                    <div className="summary-card-container">
                        <section className="summary-card">
                            <h3 className="card-label">Total Latecomers ({getDisplayDateInfo()})</h3>
                            <p className="card-value">{lateStudentsCount}</p>
                        </section>
                    </div>

                    {/* New position for Chart section, now in the top row */}
                    <div className="chart-section-container">
                        <section className="dashboard-chart-section">
                            <h3 className="section-title">Latecomers by Department</h3>
                            <div className="chart-container-bar">
                                {departmentLatecomersData().length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={departmentLatecomersData()}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="department" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="latecomers" fill="#8884d8" name="Latecomers" onClick={handleBarClick} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="no-data-message">No latecomer data available for departments within the selected date range.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* New position for Recent Late Entries section, now on the second row and spanning the full width */}
                    <div className="recent-entries-section-container">
                        <RecentLateEntries entries={recentLateEntriesForDisplay()} filterMode={filterMode} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrincipalDashboard;
