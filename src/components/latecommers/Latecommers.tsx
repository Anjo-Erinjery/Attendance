import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip } from 'recharts';
import "./HODDashboard.css";

// Interface for the fetched late arrival data
interface LateArrival {
    student_name: string;
    timestamp: string;
    department: string;
    batch: number;
}

// Interface for the complete API response from Django
interface ApiResponse {
    late_arrivals?: LateArrival[];
    department?: string;
    [key: string]: any;
}

// Interface for the props of the dynamic student table
interface StudentTableProps {
    students: LateArrival[];
    isDateRangeMode: boolean; // New prop to control table display mode
}

/**
 * A dynamic table component that displays either detailed daily records or a summary
 * of late counts for a date range.
 * @param {Object[]} students - The array of student late arrival data.
 * @param {boolean} isDateRangeMode - Flag to determine the table's display mode.
 */
const StudentTable: React.FC<StudentTableProps> = ({ students, isDateRangeMode }) => {
    // Helper function to format the arrival time
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper function to format the arrival date
    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    // Aggregate data for Date Range mode
    const aggregatedData = students.reduce((acc, curr) => {
        acc[curr.student_name] = (acc[curr.student_name] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    // Sort students by late count for Date Range mode
    const sortedStudents = Object.entries(aggregatedData)
        .sort(([, a], [, b]) => b - a);

    return (
        <div className="students-table-container">
            {isDateRangeMode && sortedStudents.length === 0 && students.length === 0 && (
                <p className="no-data-message">No latecomers found for this date range.</p>
            )}
            {!isDateRangeMode && students.length === 0 && (
                <p className="no-data-message">No latecomers found for the selected filter.</p>
            )}

            {(isDateRangeMode && sortedStudents.length > 0) || (!isDateRangeMode && students.length > 0) ? (
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                {isDateRangeMode ? (
                                    <th>Total Late Count</th>
                                ) : (
                                    <>
                                        <th>Date</th>
                                        <th>Arrival Time</th>
                                    </>
                                )}
                                {!isDateRangeMode && <th>Batch</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isDateRangeMode ? (
                                sortedStudents.map(([studentName, count], index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{studentName}</td>
                                        <td data-label="Total Late Count">{count}</td>
                                    </tr>
                                ))
                            ) : (
                                students.map((student, index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{student.student_name}</td>
                                        <td data-label="Date">{formatDate(student.timestamp)}</td>
                                        <td data-label="Arrival Time">{formatTime(student.timestamp)}</td>
                                        <td data-label="Batch">{student.batch}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};

// Main HOD Dashboard component
const LatecomersPage: React.FC = () => {
    const [students, setStudents] = useState<LateArrival[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<LateArrival[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user,token, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    const [department, setHodDepartment] = useState<string>('');
    
    // Filter states
    const [filterMode, setFilterMode] = useState<string>('today');
    const [specificDate, setSpecificDate] = useState<string>('');
    const [batches, setBatches] = useState<number[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>('All');

    // New states for Date Range filter
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    
    // Effect to fetch all data on initial load
    useEffect(() => {
        const fetchAllLatecomers = async () => {
            if (!isAuthenticated || !token) {
                setError("Please login to access this page");
                setLoading(false);
                navigate("/login");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'https://scanbyte-backend.onrender.com/api';
                const endpoint = `${API_BASE_URL_DJANGO}/hod-dashboard/`;

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    logout();
                    navigate("/login");
                    throw new Error("Session expired. Please login again.");
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.detail ||
                        errorData.message ||
                        `Access denied. Status: ${response.status}`
                    );
                }

                const data: ApiResponse = await response.json();
                
                const lateArrivals = data.late_arrivals || [];
                setStudents(lateArrivals);
                setHodDepartment(user.department || 'Your Department');

                const uniqueBatches = Array.from(new Set(lateArrivals.map(student => student.batch))).sort((a, b) => a - b);
                setBatches(uniqueBatches);

            } catch (error: any) {
                console.error("Error fetching latecomers:", error);
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    setError("Could not connect to the server. Please check your network and try again.");
                } else {
                    setError(error.message || "An unexpected error occurred while fetching data.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllLatecomers();
    }, [token, isAuthenticated, navigate, logout]);

    // Effect to apply filters whenever filter states change
    useEffect(() => {
        const applyFilters = () => {
            if (students.length === 0) {
                setFilteredStudents([]);
                return;
            }
            const filtered = filterLateArrivals(students, filterMode, specificDate, startDate, endDate, selectedBatch);
            setFilteredStudents(filtered);
        };
        applyFilters();
    }, [students, filterMode, specificDate, startDate, endDate, selectedBatch]);

    // Function to filter students based on all filter states
    const filterLateArrivals = (
        arrivals: LateArrival[],
        mode: string,
        date: string,
        start: string,
        end: string,
        batch: string
    ): LateArrival[] => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Define the date range if in dateRange mode
        const startDateObj = start ? new Date(start) : null;
        const endDateObj = end ? new Date(end) : null;

        return arrivals.filter(arrival => {
            const arrivalDate = new Date(arrival.timestamp).toISOString().split('T')[0];
            const arrivalDateObj = new Date(arrival.timestamp);
            
            let dateMatch = false;
            if (mode === 'today') {
                dateMatch = arrivalDate === today;
            } else if (mode === 'specificDate' && date) {
                dateMatch = arrivalDate === date;
            } else if (mode === 'dateRange' && startDateObj && endDateObj) {
                // Ensure the arrival is within the selected date range
                // End date is inclusive, so we add one day to the end date for the check
                const endDateInclusive = new Date(endDateObj);
                endDateInclusive.setDate(endDateInclusive.getDate() + 1);
                dateMatch = arrivalDateObj >= startDateObj && arrivalDateObj < endDateInclusive;
            } else if (mode === 'all') {
                dateMatch = true;
            }

            // Filter by batch
            const batchMatch = (batch === 'All' || arrival.batch === parseInt(batch));
            
            return dateMatch && batchMatch;
        });
    };

    // Handler for filter mode change (dropdown)
    const handleFilterModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newFilterMode = event.target.value;
        setFilterMode(newFilterMode);
        // Reset date fields when mode changes
        if (newFilterMode !== 'specificDate') setSpecificDate('');
        if (newFilterMode !== 'dateRange') {
            setStartDate('');
            setEndDate('');
        }
    };
    
    // Handler for specific date input change
    const handleSpecificDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSpecificDate(event.target.value);
        setFilterMode('specificDate');
    };

    // Handlers for date range inputs
    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(event.target.value);
        setFilterMode('dateRange');
    };

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(event.target.value);
        setFilterMode('dateRange');
    };
    
    // Handler for batch filter change
    const handleBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBatch(event.target.value);
    };

    // --- CHART DATA PROCESSING ---

    // Prepare data for the chart (daily counts for the past 7 days) for Today/Specific Date mode
    const getDailyChartData = (arrivals: LateArrival[]) => {
        const dailyCounts: { [date: string]: number } = {};
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            dailyCounts[dateString] = 0;
        }

        arrivals.forEach(arrival => {
            const arrivalDate = new Date(arrival.timestamp).toISOString().split('T')[0];
            if (dailyCounts.hasOwnProperty(arrivalDate)) {
                dailyCounts[arrivalDate]++;
            }
        });

        return Object.keys(dailyCounts).map(date => ({
            date,
            latecomers: dailyCounts[date],
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    // Prepare data for the chart (top 5 latecomers) for Date Range mode
    const getTopLatecomersChartData = (arrivals: LateArrival[]) => {
        // Aggregate counts per student
        const studentCounts: { [name: string]: number } = {};
        arrivals.forEach(student => {
            studentCounts[student.student_name] = (studentCounts[student.student_name] || 0) + 1;
        });

        // Convert to array and sort by count, then take top 5
        return Object.keys(studentCounts)
            .map(name => ({
                name,
                latecomers: studentCounts[name],
            }))
            .sort((a, b) => b.latecomers - a.latecomers)
            .slice(0, 5);
    };

    const chartData = filterMode === 'dateRange' 
        ? getTopLatecomersChartData(filteredStudents)
        : getDailyChartData(students);

    if (loading) {
        return (
            <div className="hod-dashboard flex items-center justify-center min-h-screen">
                <p className="loading-message">Loading HOD dashboard data...</p>
            </div>
        );
    }

    // --- DISPLAY LOGIC ---
    const cardTitle = filterMode === 'today' ? 'Today' : (filterMode === 'specificDate' ? specificDate : (startDate && endDate ? `${startDate} to ${endDate}` : 'All'));
    const totalLatecomers = filteredStudents.length;
    const isDateRangeMode = filterMode === 'dateRange';

    return (
        <div className="hod-dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">HOD Dashboard: {department}</h1>
                <div className="header-actions">
                    
                    <button className="logout-button" onClick={logout}>Logout</button>
                </div>
            </header>
            
            <section className="dashboard-filters">
                <div className="filter-box">
                    <label htmlFor="date-filter">Filter By:</label>
                    <select id="date-filter" value={filterMode} onChange={handleFilterModeChange}>
                        <option value="today">Today</option>
                        <option value="specificDate">Specific Date</option>
                        <option value="dateRange">Date Range</option>
                        <option value="all">All Records</option>
                    </select>
                </div>
                {filterMode === 'specificDate' && (
                    <div className="filter-box">
                        <label htmlFor="date-input">Select Date:</label>
                        <input
                            id="date-input"
                            type="date"
                            value={specificDate}
                            onChange={handleSpecificDateChange}
                        />
                    </div>
                )}
                {filterMode === 'dateRange' && (
                    <>
                        <div className="filter-box">
                            <label htmlFor="start-date-input">Start Date:</label>
                            <input
                                id="start-date-input"
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                            />
                        </div>
                        <div className="filter-box">
                            <label htmlFor="end-date-input">End Date:</label>
                            <input
                                id="end-date-input"
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                            />
                        </div>
                    </>
                )}
                <div className="filter-box">
                    <label htmlFor="batch-filter">Filter By Batch:</label>
                    <select id="batch-filter" value={selectedBatch} onChange={handleBatchChange}>
                        <option value="All">All</option>
                        {batches.map(batch => (
                            <option key={batch} value={batch}>
                                {batch}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="dashboard-summary-grid">
                <div className="summary-card">
                    <p className="card-label">Total Latecomers ({cardTitle})</p>
                    <h2 className="card-value">{totalLatecomers}</h2>
                </div>
            </section>
            
            <section className="dashboard-chart-section">
                <h3 className="section-title">
                    {isDateRangeMode ? "Top 5 Latecomers (Selected Range)" : "Latecomers (Last 7 Days)"}
                </h3>
                <div className="chart-container-bar">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={isDateRangeMode ? "name" : "date"} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="latecomers" fill="#85e26bff" name="Latecomers" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="no-data-message">No latecomer data available for the selected period.</p>
                    )}
                </div>
            </section>

            <section className="recent-latecomers-section">
                <h3 className="section-title">Latecomers Details ({cardTitle})</h3>
                <StudentTable students={filteredStudents} isDateRangeMode={isDateRangeMode} />
            </section>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default LatecomersPage;
