import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis
} from 'recharts';
import '../styles/principaldashboard/PrincipalDashboard.css'; // Corrected import path

// Define interfaces for API responses relevant to late attendance
interface TotalStudentsCount {
    totalStudentsAcrossDepartments: number;
}

interface DailyAttendanceSummary {
    presentStudents: number;
    totalStudentsToday: number;
    lateStudentsToday: number; // Crucial for late attendance focus
}

interface LatecomersByDepartment {
    department: string;
    lateCount: number;
    totalStudentsInDept: number;
}

const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate(); // Initialize useNavigate for navigation

    // States for data fetched from relevant APIs
    const [totalStudentsCount, setTotalStudentsCount] = useState<TotalStudentsCount>({ totalStudentsAcrossDepartments: 0 });
    const [dailyAttendanceSummary, setDailyAttendanceSummary] = useState<DailyAttendanceSummary>({
        presentStudents: 0,
        totalStudentsToday: 0,
        lateStudentsToday: 0
    });
    const [latecomersByDepartment, setLatecomersByDepartment] = useState<LatecomersByDepartment[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('All'); // State to track selected department in filter

    // Loading states for each data fetch operation
    const [isLoadingTotalStudents, setIsLoadingTotalStudents] = useState(true);
    const [isLoadingDailyAttendance, setIsLoadingDailyAttendance] = useState(true);
    const [isLoadingLatecomersByDepartment, setIsLoadingLatecomersByDepartment] = useState(true);

    // Error state for displaying fetch errors
    const [error, setError] = useState<string | null>(null);

    // Base URL for your Mockoon API
    const API_BASE_URL = 'http://localhost:3002'; // Ensure Mockoon runs on this port

    // --- Fetch Total Students Count Across All Departments ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingTotalStudents(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/total-students-count`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: TotalStudentsCount = await response.json();
                setTotalStudentsCount(data);
            } catch (err: any) {
                console.error("Failed to fetch total students count:", err);
                setError(`Failed to load total student data: ${err.message}`);
            } finally {
                setIsLoadingTotalStudents(false);
            }
        };
        fetchData();
    }, []);

    // --- Fetch Daily Attendance Summary (including late count) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingDailyAttendance(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/daily-attendance-summary`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: DailyAttendanceSummary = await response.json();
                setDailyAttendanceSummary(data);
            } catch (err: any) {
                console.error("Failed to fetch daily attendance summary:", err);
                setError(`Failed to load daily attendance: ${err.message}`);
            } finally {
                setIsLoadingDailyAttendance(false);
            }
        };
        fetchData();
    }, []);

    // --- Fetch Latecomers by Department (for horizontal bar chart) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingLatecomersByDepartment(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/latecomers-by-department`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: LatecomersByDepartment[] = await response.json();
                setLatecomersByDepartment(data);
            } catch (err: any) {
                console.error("Failed to fetch latecomers by department:", err);
                setError(`Failed to load latecomers by department: ${err.message}`);
            } finally {
                setIsLoadingLatecomersByDepartment(false);
            }
        };
        fetchData();
    }, []);

    // Handle department filter change and navigate to the new page
    const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const dept = event.target.value;
        setSelectedDepartment(dept); // Update selected department state
        if (dept !== 'All') {
            // Navigate to the new DepartmentLatecomers page with the selected department name
            navigate(`/department-latecomers/${dept}`);
        }
        // If 'All' is selected, the current dashboard view remains,
        // as this page focuses on overall and department-level summaries.
    };


    // Calculate Non-Latecomers Rate (students on time)
    const nonLatecomersRate = dailyAttendanceSummary.totalStudentsToday > 0
        ? parseFloat((((dailyAttendanceSummary.totalStudentsToday - dailyAttendanceSummary.lateStudentsToday) / dailyAttendanceSummary.totalStudentsToday) * 100).toFixed(2))
        : 0;

    // Calculate Latecomers Rate
    const latecomersRate = dailyAttendanceSummary.totalStudentsToday > 0
        ? parseFloat(((dailyAttendanceSummary.lateStudentsToday / dailyAttendanceSummary.totalStudentsToday) * 100).toFixed(2))
        : 0;

    // Data for Non-Latecomers Rate Gauge Chart
    const nonLatecomersGaugeData = [{
        name: 'Non-Latecomers Rate',
        value: nonLatecomersRate,
        fill: '#666666' // Neutral grey for non-latecomers (good)
    }];

    // Data for Latecomers Rate Gauge Chart
    const latecomersGaugeData = [{
        name: 'Latecomers Rate',
        value: latecomersRate,
        fill: '#333333' // Darker grey/black for latecomers (implies negative)
    }];

    // Prepare latecomers by department data for the horizontal bar chart
    // NOW USING RAW LATECOUNTS FOR THE BAR CHART
    const latecomersChartData = [...latecomersByDepartment].sort((a, b) => {
        // Sort by late count descending for visualization
        return b.lateCount - a.lateCount;
    }).map(dept => ({
        department: dept.department,
        lateCount: dept.lateCount // Using lateCount directly
    }));

    // Dynamically calculate the maximum late count for the XAxis domain
    const maxLateCount = Math.max(...latecomersChartData.map(d => d.lateCount), 0);
    // Set a buffer for the XAxis domain, e.g., 10% more than max, or a minimum of 10 if max is very small
    const xAxisDomainMax = maxLateCount > 0 ? Math.ceil(maxLateCount * 1.1) : 10;


    return (
        <div className="principal-dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Principal Dashboard (Late Attendance)</h1>
                <div className="header-actions">
                    {/* Icons can be added here if needed, e.g., refresh, settings */}
                </div>
            </header>

            {/* Display a general error message if any fetch failed */}
            {error && (
                <div className="error-message">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <section className="dashboard-filters">
                <div className="filter-box">
                    <label htmlFor="date-range">Date</label>
                    <select id="date-range">
                        <option>Current Day</option>
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        {/* Add dynamic date ranges here later */}
                    </select>
                </div>
                <div className="filter-box">
                    <label htmlFor="departments">Departments</label>
                    {/* Attach onChange handler and value to the select element */}
                    <select id="departments" onChange={handleDepartmentChange} value={selectedDepartment}>
                        <option value="All">All</option> {/* Value 'All' will prevent navigation */}
                        {latecomersByDepartment.map(dept => (
                            <option key={dept.department} value={dept.department}>{dept.department}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="dashboard-summary-grid">
                {/* Summary Cards - Student-centric data, focused on late attendance */}
                <div className="summary-card">
                    <h3 className="card-label">Total Students Enrolled</h3>
                    {isLoadingTotalStudents ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{totalStudentsCount.totalStudentsAcrossDepartments}</p>
                    )}
                </div>

                <div className="summary-card">
                    <h3 className="card-label">Students Present Today</h3>
                    {isLoadingDailyAttendance ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{dailyAttendanceSummary.presentStudents}</p>
                    )}
                </div>

                <div className="summary-card">
                    <h3 className="card-label">Latecomers Today</h3>
                    {isLoadingDailyAttendance ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{dailyAttendanceSummary.lateStudentsToday}</p>
                    )}
                </div>

                {/* Non-Latecomers Rate Gauge */}
                <div className="summary-card chart-card">
                    <h3 className="card-label">Non-Latecomers Rate</h3>
                    <div className="chart-container-gauge">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="70%"
                                outerRadius="90%"
                                barSize={10}
                                data={nonLatecomersGaugeData}
                                startAngle={225}
                                endAngle={-45}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar
                                    label={{
                                        position: 'insideStart',
                                        fill: '#fff',
                                        formatter: (label: React.ReactNode) => {
                                            if (typeof label === 'number') {
                                                return `${label.toFixed(2)}%`;
                                            }
                                            return label;
                                        }
                                    }}
                                    background
                                    dataKey="value"
                                />
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                <text
                                    x="50%"
                                    y="55%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="gauge-label"
                                >
                                    {nonLatecomersRate}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Latecomers Rate Gauge */}
                <div className="summary-card chart-card">
                    <h3 className="card-label">Latecomers Rate</h3>
                    <div className="chart-container-gauge">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="70%"
                                outerRadius="90%"
                                barSize={10}
                                data={latecomersGaugeData}
                                startAngle={225}
                                endAngle={-45}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar
                                    label={{
                                        position: 'insideStart',
                                        fill: '#fff',
                                        formatter: (label: React.ReactNode) => {
                                            if (typeof label === 'number') {
                                                return `${label.toFixed(2)}%`;
                                            }
                                            return label;
                                        }
                                    }}
                                    background
                                    dataKey="value"
                                />
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                <text
                                    x="50%"
                                    y="55%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="gauge-label"
                                >
                                    {latecomersRate}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Latecomers by Department Chart Section */}
            <section className="dashboard-chart-section">
                <h3 className="section-title">Latecomers by Department</h3>
                {isLoadingLatecomersByDepartment ? (
                    <p className="loading-message">Loading latecomers data...</p>
                ) : latecomersChartData.length > 0 ? (
                    <div className="chart-container-large">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={latecomersChartData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                {/* XAxis now reflects raw late counts */}
                                <XAxis
                                    type="number"
                                    domain={[0, xAxisDomainMax]} // Dynamic domain based on max late count
                                    label={{ value: 'Number of Latecomers', position: 'bottom', offset: 0 }}
                                />
                                <YAxis type="category" dataKey="department" width={120} />
                                {/* Tooltip formatter adjusted for raw numbers */}
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => `${value} students`} />
                                <Legend />
                                {/* Bar dataKey and name adjusted for raw numbers */}
                                <Bar dataKey="lateCount" fill="#666666" name="Number of Latecomers" /> {/* Neutral grey fill */}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="no-data-message">No latecomers data by department available.</p>
                )}
            </section>

            {/* Quick Actions */}
            <section className="quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="actions-grid">
                    <button>View Late Entry Logs</button>
                    <button>Generate Latecomer Report</button>
                    <button>Manage Event Attendance</button>
                </div>
            </section>
        </div>
    );
};

export default PrincipalDashboard;
