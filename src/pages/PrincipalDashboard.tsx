import React, { useState, useEffect } from 'react';
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
import '../styles/PrincipalDashboard.css'; // Ensure this CSS file is correctly linked

// Define interfaces for API responses
interface TotalStudentsCount {
    totalStudentsAcrossDepartments: number;
}

interface DailyAttendanceSummary {
    presentStudents: number;
    totalStudentsToday: number;
}

interface DepartmentAttendance {
    department: string;
    attendanceRate: string; // e.g., "95%"
    totalStudents: number;
}

// NEW INTERFACES for student-centric data from new APIs
interface TotalStudentAbsences {
    totalStudentAbsences: number;
}

interface StudentLeaveTypes {
    sickLeaves: number;
    otherLeaves: number;
}

interface PreapprovedStudentLeaves {
    preapprovedStudentLeaves: number;
}

interface UnscheduledStudentAbsences {
    unscheduledStudentAbsences: number;
}

interface StudentsOnProbation {
    studentsOnProbation: number;
}

const PrincipalDashboard: React.FC = () => {
    // States for data fetched from APIs
    const [totalStudentsCount, setTotalStudentsCount] = useState<TotalStudentsCount>({ totalStudentsAcrossDepartments: 0 });
    const [dailyAttendanceSummary, setDailyAttendanceSummary] = useState<DailyAttendanceSummary>({
        presentStudents: 0,
        totalStudentsToday: 0
    });
    const [departmentAttendance, setDepartmentAttendance] = useState<DepartmentAttendance[]>([]);

    // States for NEW student-centric data from newly created APIs
    const [totalStudentAbsences, setTotalStudentAbsences] = useState<TotalStudentAbsences>({ totalStudentAbsences: 0 });
    const [studentLeaveTypes, setStudentLeaveTypes] = useState<StudentLeaveTypes>({ sickLeaves: 0, otherLeaves: 0 });
    const [preapprovedStudentLeaves, setPreapprovedStudentLeaves] = useState<PreapprovedStudentLeaves>({ preapprovedStudentLeaves: 0 });
    const [unscheduledStudentAbsences, setUnscheduledStudentAbsences] = useState<UnscheduledStudentAbsences>({ unscheduledStudentAbsences: 0 });
    const [studentsOnProbation, setStudentsOnProbation] = useState<StudentsOnProbation>({ studentsOnProbation: 0 });

    // Loading states for each data fetch operation
    const [isLoadingTotalStudents, setIsLoadingTotalStudents] = useState(true);
    const [isLoadingDailyAttendance, setIsLoadingDailyAttendance] = useState(true);
    const [isLoadingDepartmentAttendance, setIsLoadingDepartmentAttendance] = useState(true);
    // New loading states for new APIs
    const [isLoadingTotalStudentAbsences, setIsLoadingTotalStudentAbsences] = useState(true);
    const [isLoadingStudentLeaveTypes, setIsLoadingStudentLeaveTypes] = useState(true);
    const [isLoadingPreapprovedStudentLeaves, setIsLoadingPreapprovedStudentLeaves] = useState(true);
    const [isLoadingUnscheduledStudentAbsences, setIsLoadingUnscheduledStudentAbsences] = useState(true);
    const [isLoadingStudentsOnProbation, setIsLoadingStudentsOnProbation] = useState(true);

    // Error state for displaying fetch errors
    const [error, setError] = useState<string | null>(null);

    // Base URL for your Mockoon API
    const API_BASE_URL = 'http://localhost:3002'; // Ensure Mockoon runs on this port

    // --- Fetch Total Students Count Across All Departments ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingTotalStudents(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/all-students-count`);
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

    // --- Fetch Daily Attendance Summary (for overall percentage and Present Students Today) ---
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

    // --- Fetch Department Attendance (for horizontal bar chart) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingDepartmentAttendance(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/department-attendance`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: DepartmentAttendance[] = await response.json();
                setDepartmentAttendance(data);
            } catch (err: any) {
                console.error("Failed to fetch department attendance:", err);
                setError(`Failed to load department attendance: ${err.message}`);
            } finally {
                setIsLoadingDepartmentAttendance(false);
            }
        };
        fetchData();
    }, []);

    // --- NEW API FETCH: Total Student Absences ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingTotalStudentAbsences(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/total-student-absences`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: TotalStudentAbsences = await response.json();
                setTotalStudentAbsences(data);
            } catch (err: any) {
                console.error("Failed to fetch total student absences:", err);
                setError(`Failed to load total student absences: ${err.message}`);
            } finally {
                setIsLoadingTotalStudentAbsences(false);
            }
        };
        fetchData();
    }, []);

    // --- NEW API FETCH: Student Leave Types (Sick vs Other) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingStudentLeaveTypes(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/student-leave-types`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: StudentLeaveTypes = await response.json();
                setStudentLeaveTypes(data);
            } catch (err: any) {
                console.error("Failed to fetch student leave types:", err);
                setError(`Failed to load student leave types: ${err.message}`);
            } finally {
                setIsLoadingStudentLeaveTypes(false);
            }
        };
        fetchData();
    }, []);

    // --- NEW API FETCH: Pre-approved Student Leaves ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingPreapprovedStudentLeaves(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/preapproved-student-leaves`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: PreapprovedStudentLeaves = await response.json();
                setPreapprovedStudentLeaves(data);
            } catch (err: any) {
                console.error("Failed to fetch pre-approved student leaves:", err);
                setError(`Failed to load pre-approved student leaves: ${err.message}`);
            } finally {
                setIsLoadingPreapprovedStudentLeaves(false);
            }
        };
        fetchData();
    }, []);

    // --- NEW API FETCH: Unscheduled Student Absences ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingUnscheduledStudentAbsences(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/unscheduled-student-absences`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: UnscheduledStudentAbsences = await response.json();
                setUnscheduledStudentAbsences(data);
            } catch (err: any) {
                console.error("Failed to fetch unscheduled student absences:", err);
                setError(`Failed to load unscheduled student absences: ${err.message}`);
            } finally {
                setIsLoadingUnscheduledStudentAbsences(false);
            }
        };
        fetchData();
    }, []);

    // --- NEW API FETCH: Students on Academic Probation ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingStudentsOnProbation(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/students-on-probation`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: StudentsOnProbation = await response.json();
                setStudentsOnProbation(data);
            } catch (err: any) {
                console.error("Failed to fetch students on probation:", err);
                setError(`Failed to load students on probation: ${err.message}`);
            } finally {
                setIsLoadingStudentsOnProbation(false);
            }
        };
        fetchData();
    }, []);


    // Calculate overall daily attendance percentage
    const overallDailyAttendancePercentage = dailyAttendanceSummary.totalStudentsToday > 0
        ? parseFloat(((dailyAttendanceSummary.presentStudents / dailyAttendanceSummary.totalStudentsToday) * 100).toFixed(2))
        : 0;

    // Calculate Absenteeism Rate (based on daily attendance summary)
    const absenteeismRate = dailyAttendanceSummary.totalStudentsToday > 0
        ? parseFloat((((dailyAttendanceSummary.totalStudentsToday - dailyAttendanceSummary.presentStudents) / dailyAttendanceSummary.totalStudentsToday) * 100).toFixed(2))
        : 0;

    // Data for Attendance Rate Gauge Chart
    const attendanceGaugeData = [{
        name: 'Attendance Rate',
        value: overallDailyAttendancePercentage,
        fill: '#8884d8' // This fill color will be overridden by CSS for minimal theme
    }];

    // Data for Absenteeism Rate Gauge Chart
    const absenteeismGaugeData = [{
        name: 'Absenteeism Rate',
        value: absenteeismRate,
        fill: '#dc3545' // This fill color will be overridden by CSS for minimal theme
    }];

    // Prepare department attendance data for the horizontal bar chart
    // Sort by attendance rate descending for better visualization, as in the image
    const departmentChartData = [...departmentAttendance].sort((a, b) =>
        parseFloat(b.attendanceRate.replace('%', '')) - parseFloat(a.attendanceRate.replace('%', ''))
    ).map(dept => ({
        department: dept.department,
        attendance: parseFloat(dept.attendanceRate.replace('%', ''))
    }));


    return (
        <div className="principal-dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Principal Dashboard</h1>
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
                    <select id="departments">
                        <option>All</option>
                        {departmentAttendance.map(dept => (
                            <option key={dept.department} value={dept.department}>{dept.department}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="dashboard-summary-grid">
                {/* Summary Cards - Student-centric data */}
                <div className="summary-card">
                    <h3 className="card-label">Total Students</h3>
                    {isLoadingTotalStudents ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{totalStudentsCount.totalStudentsAcrossDepartments}</p>
                    )}
                </div>

                <div className="summary-card">
                    <h3 className="card-label">Total Student Absences</h3>
                    {isLoadingTotalStudentAbsences ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{totalStudentAbsences.totalStudentAbsences}</p>
                    )}
                </div>

                <div className="summary-card">
                    <h3 className="card-label">Sick vs. Other Leaves</h3>
                    {isLoadingStudentLeaveTypes ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <>
                            <p className="card-value-small">{studentLeaveTypes.sickLeaves} <span className="card-sub-label">Sick</span></p>
                            <p className="card-value-small">{studentLeaveTypes.otherLeaves} <span className="card-sub-label">Other</span></p>
                        </>
                    )}
                </div>

                {/* This card replaces the "Employee Work Location Breakdown" and is removed */}

                <div className="summary-card">
                    <h3 className="card-label">Pre-approved Student Leaves</h3>
                    {isLoadingPreapprovedStudentLeaves ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{preapprovedStudentLeaves.preapprovedStudentLeaves}</p>
                    )}
                </div>

                {/* "Overtime Hours" card is removed */}

                <div className="summary-card">
                    <h3 className="card-label">Present Students Today</h3>
                    {isLoadingDailyAttendance ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{dailyAttendanceSummary.presentStudents}</p>
                    )}
                </div>

                <div className="summary-card">
                    <h3 className="card-label">Unscheduled Student Absences</h3>
                    {isLoadingUnscheduledStudentAbsences ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{unscheduledStudentAbsences.unscheduledStudentAbsences}</p>
                    )}
                </div>

                {/* Attendance Gauges */}
                <div className="summary-card chart-card">
                    <h3 className="card-label">Attendance Rate</h3>
                    <div className="chart-container-gauge">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="70%"
                                outerRadius="90%"
                                barSize={10}
                                data={attendanceGaugeData}
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
                                    {overallDailyAttendancePercentage}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="summary-card chart-card">
                    <h3 className="card-label">Absenteeism Rate</h3>
                    <div className="chart-container-gauge">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="70%"
                                outerRadius="90%"
                                barSize={10}
                                data={absenteeismGaugeData}
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
                                    {absenteeismRate}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="summary-card">
                    <h3 className="card-label">Students on Academic Probation</h3>
                    {isLoadingStudentsOnProbation ? (
                        <p className="card-value loading">...</p>
                    ) : (
                        <p className="card-value">{studentsOnProbation.studentsOnProbation}</p>
                    )}
                </div>
            </section>

            {/* Attendance by Department Chart Section */}
            <section className="dashboard-chart-section">
                <h3 className="section-title">Attendance by Department</h3>
                {isLoadingDepartmentAttendance ? (
                    <p className="loading-message">Loading department attendance data...</p>
                ) : departmentChartData.length > 0 ? (
                    <div className="chart-container-large">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={departmentChartData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} label={{ value: 'Attendance %', position: 'bottom', offset: 0 }} />
                                <YAxis type="category" dataKey="department" width={120} />
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => `${value.toFixed(2)}%`} />
                                <Legend />
                                <Bar dataKey="attendance" fill="#82ca9d" name="Attendance Rate" /> {/* This fill will be overridden by CSS */}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="no-data-message">No department attendance data available.</p>
                )}
            </section>

            {/* Quick Actions */}
            <section className="quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="actions-grid">
                    <button>Manage Events</button>
                    <button>Monitor Attendance</button>
                    <button>Generate Custom Report</button>
                </div>
            </section>
        </div>
    );
};

export default PrincipalDashboard;
