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

// Interface for user data received from Django API.
interface DjangoUserData {
    name: string;
    role: string;
}

// Interface for individual late arrival records from Django API.
interface DjangoLateArrival {
    student_name: string;
    department: string;
    batch: number;
    timestamp: string;
}

// Interface for the complete Principal Dashboard data from Django API.
interface PrincipalDashboardDjangoData {
    user: DjangoUserData;
    late_arrivals: DjangoLateArrival[];
}

const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, logout } = useAuthStore();

    const [filterMode, setFilterMode] = useState<string>('currentDay');
    const [specificDate, setSpecificDate] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [departments, setDepartments] = useState<string[]>(['All']);
    const [selectedBatch, setSelectedBatch] = useState<number | 'All'>('All');
    const [batches, setBatches] = useState<(number | 'All')[]>(['All']);

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

                const uniqueBatches = Array.from(new Set(data.late_arrivals.map(arrival => arrival.batch)));
                setBatches(['All', ...uniqueBatches.sort((a, b) => a - b)]);

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

    const handleBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedBatch(value === 'All' ? 'All' : Number(value));
    };

    const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedDepartment(selectedValue);

        if (selectedValue !== 'All') {
            if (principalDashboardDjangoData) {
                const urlDepartmentName = encodeURIComponent(selectedValue.toLowerCase().replace(/\s/g, '-'));
                navigate(`/department-dashboard/${urlDepartmentName}`, {
                    state: {
                        allLateArrivalsData: principalDashboardDjangoData.late_arrivals,
                        filterDateInfo: {
                            mode: filterMode,
                            specificDate: specificDate,
                            startDate: startDate,
                            endDate: endDate
                        },
                        selectedBatch: selectedBatch
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
                isWithinDateRange = arrivalDateTime >= startFilterDate && arrivalDateTime <= endFilterDate;
            }

            const isWithinDepartment = selectedDepartment === 'All' ||
                arrival.department.toLowerCase().trim() === selectedDepartment.toLowerCase().trim();

            const isWithinBatch = selectedBatch === 'All' || arrival.batch === selectedBatch;

            return isWithinDateRange && isWithinDepartment && isWithinBatch;
        });
    };

    const filteredLateArrivals = principalDashboardDjangoData?.late_arrivals
        ? filterLateArrivals(principalDashboardDjangoData.late_arrivals)
        : [];

    const lateStudentsCount = filteredLateArrivals.length;

    const departmentLatecomersData = () => {
        const departmentCounts: { [key: string]: number } = {};
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

    const recentLateEntriesDisplay = () => {
        if (filterMode === 'monthly') {
            const studentMonthlyCounts = new Map<string, { count: number; department: string; }>();
            filteredLateArrivals.forEach(entry => {
                const key = entry.student_name;
                studentMonthlyCounts.set(key, {
                    count: (studentMonthlyCounts.get(key)?.count || 0) + 1,
                    department: entry.department,
                });
            });
            return Array.from(studentMonthlyCounts.entries()).map(([name, data]) => ({
                student_name: `${name} (${data.count})`,
                department: data.department,
                timestamp: ''
            })).sort((a, b) => b.student_name.localeCompare(a.student_name));
        } else {
            return [...filteredLateArrivals]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
    };

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
                selectedBatch: selectedBatch
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
                <h1 className="dashboard-title">Principal Dashboard (Late Attendance)</h1>
                <div className="header-actions">
                    {principalDashboardDjangoData?.user?.name && (
                        <span className="text-gray-700 font-medium mr-4">Welcome, {principalDashboardDjangoData.user.name}</span>
                    )}
                    <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 ease-in-out">
                        Logout
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
                            value={specificDate}
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
                                value={startDate}
                                onChange={handleStartDateChange}
                            />
                        </div>
                        <div className="filter-box">
                            <label htmlFor="end-date">To Date</label>
                            <input
                                id="end-date"
                                type="date"
                                value={endDate}
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
                    <label htmlFor="batches">Batch</label>
                    <select id="batches" onChange={handleBatchChange} value={selectedBatch}>
                        {batches.map(batch => (
                            <option key={batch} value={batch}>
                                {batch === 'All' ? 'All' : `Batch ${batch}`}
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
                        <section className="recent-latecomers-section">
                            <h3 className="section-title">Recent Late Entries</h3>
                            <div className="recent-entries-content">
                                {recentLateEntriesDisplay().length > 0 ? (
                                    recentLateEntriesDisplay().map((entry, index) => (
                                        <div key={index} className="recent-entry-item">
                                            <div className="entry-details">
                                                <p className="entry-name">{entry.student_name}</p>
                                                <p className="entry-department">{entry.department}</p>
                                            </div>
                                            {filterMode !== 'monthly' && entry.timestamp && (
                                                <p className="entry-time">{formatTimestamp(entry.timestamp)}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data-message">No recent late entries available for this period.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrincipalDashboard;