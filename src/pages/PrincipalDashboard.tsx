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
    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [departments, setDepartments] = useState<string[]>(['All']);
    // New state for batch filtering
    const [selectedBatch, setSelectedBatch] = useState<number | 'All'>('All');
    const [batches, setBatches] = useState<(number | 'All')[]>(['All']);

    const [principalDashboardDjangoData, setPrincipalDashboardDjangoData] = useState<PrincipalDashboardDjangoData | null>(null);
    const [isLoadingPrincipalDashboardDjangoData, setIsLoadingPrincipalDashboardDjangoData] = useState(true);
    const [errorPrincipalDashboardDjango, setErrorPrincipalDashboardDjango] = useState<string | null>(null);

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
                const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
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
                
                // New: Extract and set unique batches from the data
                const uniqueBatches = Array.from(new Set(data.late_arrivals.map(arrival => arrival.batch)));
                setBatches(['All', ...uniqueBatches.sort((a, b) => a - b)]);
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
        setFilterMode(event.target.value);
        setSpecificDate('');
    };
    
    const handleSpecificDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSpecificDate(event.target.value);
        setFilterMode('specificDate');
    };

    // New event handler for batch filter
    const handleBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedBatch(value === 'All' ? 'All' : Number(value));
    };

    // A utility to get the actual date string being used for filtering
    const getFilteredDate = (): string => {
        if (filterMode === 'specificDate' && specificDate) {
            return specificDate;
        }
        // Use the latest date from data if available, otherwise fallback to today's date
        const latestTimestamp = principalDashboardDjangoData?.late_arrivals.reduce((latest, arrival) => {
            const arrivalDate = new Date(arrival.timestamp);
            return latest && latest > arrivalDate ? latest : arrivalDate;
        }, new Date('1970-01-01'));
        
        return latestTimestamp ? latestTimestamp.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    };

    const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedDepartment(selectedValue);
        if (selectedValue !== 'All') {
            if (principalDashboardDjangoData) {
                // Pass the selected date and filter mode in the state object
                const filteredDate = getFilteredDate();
                navigate(`/department-dashboard/${selectedValue.toLowerCase().replace(/\s/g, '-')}`, {
                    state: { 
                        lateArrivals: principalDashboardDjangoData.late_arrivals,
                        filterDate: filteredDate,
                        filterMode: filterMode
                    }
                });
            }
        }
    };

    const filterLateArrivals = (arrivals: DjangoLateArrival[]) => {
        const latestDate = arrivals.reduce((latest, arrival) => {
            const arrivalTimestamp = new Date(arrival.timestamp);
            if (!latest || arrivalTimestamp > latest) {
                return arrivalTimestamp;
            }
            return latest;
        }, null as Date | null);

        const currentDate = latestDate ? new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate()) : null;

        return arrivals.filter(arrival => {
            const arrivalDate = new Date(arrival.timestamp);
            const isWithinDateRange = (() => {
                if (filterMode === 'currentDay') {
                    if (!currentDate) return false;
                    const arrivalDateNormalized = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate());
                    return arrivalDateNormalized.getTime() === currentDate.getTime();
                } else if (filterMode === 'specificDate' && specificDate) {
                    // Normalize both dates to UTC to avoid timezone issues
                    const [year, month, day] = specificDate.split('-').map(Number);
                    const normalizedSpecificDateUTC = new Date(Date.UTC(year, month - 1, day));
                    const arrivalDateNormalizedUTC = new Date(Date.UTC(
                        arrivalDate.getUTCFullYear(),
                        arrivalDate.getUTCMonth(),
                        arrivalDate.getUTCDate()
                    ));
                    return arrivalDateNormalizedUTC.getTime() === normalizedSpecificDateUTC.getTime();
                }
                return false;
            })();

            const isWithinDepartment = (() => {
                if (selectedDepartment === 'All') {
                    return true;
                }
                return arrival.department.toUpperCase() === selectedDepartment.toUpperCase();
            })();

            // New: Check if the arrival's batch matches the selected batch
            const isWithinBatch = selectedBatch === 'All' || arrival.batch === selectedBatch;

            // Combine all filter conditions
            return isWithinDateRange && isWithinDepartment && isWithinBatch;
        });
    };

    const filteredLateArrivals = principalDashboardDjangoData?.late_arrivals
        ? filterLateArrivals(principalDashboardDjangoData.late_arrivals)
        : [];

    const lateStudentsCount = filteredLateArrivals.length;

    const departmentLatecomersData = () => {
        const departmentCounts: { [key: string]: number } = {};
        departments.filter(d => d !== 'All').forEach(dept => departmentCounts[dept] = 0);

        filteredLateArrivals.forEach(arrival => {
            const departmentName = arrival.department.toUpperCase();
            const existingDepartment = departments.find(d => d.toUpperCase() === departmentName);
            if (existingDepartment) {
                departmentCounts[existingDepartment]++;
            }
        });
    
        return Object.keys(departmentCounts).map(dept => ({
            department: dept,
            latecomers: departmentCounts[dept],
        }));
    };
    
    // Sort the filtered data. Removed .slice() to display all latecomers for the selected day.
    const recentLateEntries = [...filteredLateArrivals]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };
    
    if (isLoadingPrincipalDashboardDjangoData) {
        return (
            <div className="principal-dashboard flex items-center justify-center min-h-screen">
                <p className="loading-message">Loading dashboard data...</p>
            </div>
        );
    }

    const cardTitle = filterMode === 'currentDay' ? 'Today' : specificDate;
    
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
                        <option value="specificDate">Specific Date</option>
                    </select>
                </div>
                {filterMode === 'specificDate' && (
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
                <div className="filter-box">
                    <label htmlFor="departments">Departments</label>
                    <select id="departments" onChange={handleDepartmentChange} value={selectedDepartment}>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                {/* New: Batch Filter Card */}
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
            
            <section className="dashboard-summary-grid">
                <div className="summary-card">
                    <h3 className="card-label">Latecomers ({cardTitle})</h3>
                    <p className="card-value">{lateStudentsCount}</p>
                </div>

                <div className="summary-card recent-entries-card">
                    <h3 className="card-label">Recent Late Entries ({cardTitle})</h3>
                    <div className="recent-entries-content">
                        {recentLateEntries.length > 0 ? (
                            recentLateEntries.map((entry, index) => (
                                <div key={index} className="recent-entry-item">
                                    <div className="entry-details">
                                        <p className="entry-name">{entry.student_name}</p>
                                        <p className="entry-department">{entry.department}</p>
                                    </div>
                                    <p className="entry-time">{formatTimestamp(entry.timestamp)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="no-data-message">No recent late entries available for this day.</p>
                        )}
                    </div>
                </div>
            </section>
            
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
                                <Bar dataKey="latecomers" fill="#8884d8" name="Latecomers" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="no-data-message">No latecomer data available for departments within the selected date range.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default PrincipalDashboard;