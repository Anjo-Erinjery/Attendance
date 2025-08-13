import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import '../styles/principaldashboard/PrincipalDashboard.css';

// Define interfaces for API responses relevant to late attendance
interface DailyAttendanceSummary {
    presentStudents: number;
    totalStudentsToday: number;
    lateStudentsToday: number;
}

interface LatecomersByDepartment {
    department: string;
    lateCount: number;
    totalStudentsInDept: number;
}

const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate();

    // State for the selected date range filter
    const [selectedDateRange, setSelectedDateRange] = useState<string>('currentDay');

    // States for data fetched from relevant APIs
    const [dailyAttendanceSummary, setDailyAttendanceSummary] = useState<DailyAttendanceSummary>({
        presentStudents: 0,
        totalStudentsToday: 0,
        lateStudentsToday: 0
    });
    const [latecomersByDepartment, setLatecomersByDepartment] = useState<LatecomersByDepartment[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

    // Loading states for each data fetch operation
    const [isLoadingDailyAttendance, setIsLoadingDailyAttendance] = useState(true);
    const [isLoadingLatecomersByDepartment, setIsLoadingLatecomersByDepartment] = useState(true);

    // Error state for displaying fetch errors
    const [error, setError] = useState<string | null>(null);

    // Base URL for your Mockoon API
    const API_BASE_URL = 'http://localhost:3002';

    // --- Fetch Attendance Summary (Daily or Average) ---
    useEffect(() => {
        const fetchAttendanceSummary = async () => {
            setIsLoadingDailyAttendance(true);
            try {
                let url = '';
                if (selectedDateRange === 'currentDay') {
                    url = `${API_BASE_URL}/api/daily-attendance-summary`;
                } else {
                    url = `${API_BASE_URL}/api/average-attendance-summary-range=${selectedDateRange}`;
                }
                
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: DailyAttendanceSummary = await response.json();
                setDailyAttendanceSummary(data);
            } catch (err: any) {
                console.error(`Failed to fetch attendance summary for ${selectedDateRange}:`, err);
                setError(`Failed to load attendance summary: ${err.message}`);
            } finally {
                setIsLoadingDailyAttendance(false);
            }
        };
        fetchAttendanceSummary();
    }, [selectedDateRange]); // Re-fetch when date range changes

    // --- Fetch Latecomers by Department (Daily or Average) ---
    useEffect(() => {
        const fetchLatecomersByDepartment = async () => {
            setIsLoadingLatecomersByDepartment(true);
            try {
                let url = '';
                if (selectedDateRange === 'currentDay') {
                    url = `${API_BASE_URL}/api/latecomers-by-department`;
                } else {
                    url = `${API_BASE_URL}/api/average-latecomers-by-department-range=${selectedDateRange}`;
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: LatecomersByDepartment[] = await response.json();
                setLatecomersByDepartment(data);
            } catch (err: any) {
                console.error(`Failed to fetch latecomers by department for ${selectedDateRange}:`, err);
                setError(`Failed to load latecomers by department: ${err.message}`);
            } finally {
                setIsLoadingLatecomersByDepartment(false);
            }
        };
        fetchLatecomersByDepartment();
    }, [selectedDateRange]); // Re-fetch when date range changes

    // Handle date range filter change
    const handleDateRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDateRange(event.target.value);
    };

    // Handle department filter change and navigate to the new page
    const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const dept = event.target.value;
        setSelectedDepartment(dept);
        if (dept !== 'All') {
            navigate(`/department-latecomers/${dept}`);
        }
    };

    // Determine card labels based on selectedDateRange
    const presentStudentsLabel = selectedDateRange === 'currentDay' ? "Students Present Today" : `Avg. Students Present (${selectedDateRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'})`;
    const latecomersLabel = selectedDateRange === 'currentDay' ? "Latecomers Today" : `Avg. Latecomers (${selectedDateRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'})`;


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
        fill: '#666666'
    }];

    // Data for Latecomers Rate Gauge Chart
    const latecomersGaugeData = [{
        name: 'Latecomers Rate',
        value: latecomersRate,
        fill: '#333333'
    }];

    // Prepare latecomers by department data for the horizontal bar chart
    const latecomersChartData = [...latecomersByDepartment].sort((a, b) => {
        return b.lateCount - a.lateCount;
    }).map(dept => ({
        department: dept.department,
        lateCount: dept.lateCount
    }));

    const maxLateCount = Math.max(...latecomersChartData.map(d => d.lateCount), 0);
    const xAxisDomainMax = maxLateCount > 0 ? Math.ceil(maxLateCount * 1.1) : 10;


    return (
        <div className="principal-dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Principal Dashboard (Late Attendance)</h1>
                <div className="header-actions">
                </div>
            </header>

            {error && (
                <div className="error-message">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <section className="dashboard-filters">
                <div className="filter-box">
                    <label htmlFor="date-range">Date</label>
                    <select id="date-range" onChange={handleDateRangeChange} value={selectedDateRange}>
                        <option value="currentDay">Current Day</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                </div>
                <div className="filter-box">
                    <label htmlFor="departments">Departments</label>
                    <select id="departments" onChange={handleDepartmentChange} value={selectedDepartment}>
                        <option value="All">All</option>
                        {latecomersByDepartment.map(dept => (
                            <option key={dept.department} value={dept.department}>{dept.department}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="dashboard-summary-grid">
           <div className="summary-card">
                    <h3 className="card-label">{presentStudentsLabel}</h3>
              {/* Summary Cards - Student-centric data, focused on late attendance */}
                {/* <div className="summary-card">
                    <h3 className="card-label">Total Students Enrolled</h3>
                    {isLoadingTotalStudents ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{totalStudentsCount.totalStudentsAcrossDepartments}</p>
                    )}
                </div> */}

                {/* <div className="summary-card">
                    <h3 className="card-label">Students Present Today</h3>

                    {isLoadingDailyAttendance ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{dailyAttendanceSummary.presentStudents}</p>
                    )}
                </div> */}

                <div className="summary-card">
                    <h3 className="card-label">{latecomersLabel}</h3>
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
                <h3 className="section-title">Latecomers by Department ({selectedDateRange === 'currentDay' ? 'Current Day' : selectedDateRange === '7days' ? 'Last 7 Days Average' : 'Last 30 Days Average'})</h3>
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
                                    label={{ value: `Number of Latecomers (${selectedDateRange === 'currentDay' ? 'Current Day' : 'Average'})`, position: 'bottom', offset: 0 }}
                                />
                                <YAxis type="category" dataKey="department" width={120} />
                                {/* Tooltip formatter adjusted for raw numbers */}
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => `${value} students`} />
                                <Legend />
                                {/* Bar dataKey and name adjusted for raw numbers */}
                                <Bar dataKey="lateCount" fill="#666666" name={`Number of Latecomers (${selectedDateRange === 'currentDay' ? 'Current Day' : 'Average'})`} /> {/* Neutral grey fill */}
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
