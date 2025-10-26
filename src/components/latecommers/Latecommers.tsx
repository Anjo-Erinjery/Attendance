import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip, Cell } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./HODDashboard.css";

// Declare XLSX globally since we're loading it via CDN
declare const XLSX: any;

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
    isDateRangeMode: boolean;
    showAggregateColumn: boolean;
    allStudents?: LateArrival[];
    tableRef?: React.RefObject<HTMLTableElement>;
}

/**
 * A dynamic table component that displays either detailed daily records or a summary
 * of late counts for a date range.
 */
const StudentTable: React.FC<StudentTableProps> = ({ 
    students, 
    isDateRangeMode, 
    showAggregateColumn,
    allStudents = [],
    tableRef
}) => {
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

    // Calculate aggregate counts for all students
    const calculateAggregateCounts = (students: LateArrival[]) => {
        return students.reduce((acc, curr) => {
            acc[curr.student_name] = (acc[curr.student_name] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    };

    const aggregateCounts = calculateAggregateCounts(allStudents);

    // Sort students by timestamp in descending order (most recent first) for non-date-range mode
    const sortedRecentStudents = [...students].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Aggregate data for Date Range mode
    const aggregatedData = students.reduce((acc, curr) => {
        acc[curr.student_name] = (acc[curr.student_name] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    // Sort students by late count for Date Range mode
    const sortedStudents = Object.entries(aggregatedData)
        .sort(([, a], [, b]) => b - a);

    return (
        <div className="hod-students-table-container">
            {isDateRangeMode && sortedStudents.length === 0 && students.length === 0 && (
                <p className="hod-no-data-message">No latecomers found for this date range.</p>
            )}
            {!isDateRangeMode && students.length === 0 && (
                <p className="hod-no-data-message">No latecomers found for the selected filter.</p>
            )}

            {(isDateRangeMode && sortedStudents.length > 0) || (!isDateRangeMode && students.length > 0) ? (
                <div className="overflow-x-auto">
                    <table ref={tableRef} className="hod-students-table">
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
                                {showAggregateColumn && <th>Total Late Count (All Time)</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isDateRangeMode ? (
                                sortedStudents.map(([studentName, count], index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{studentName}</td>
                                        <td data-label="Total Late Count">{count}</td>
                                        {showAggregateColumn && (
                                            <td data-label="Total Late Count (All Time)">
                                                {aggregateCounts[studentName] || 0}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                sortedRecentStudents.map((student, index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{student.student_name}</td>
                                        <td data-label="Date">{formatDate(student.timestamp)}</td>
                                        <td data-label="Arrival Time">{formatTime(student.timestamp)}</td>
                                        <td data-label="Batch">{student.batch}</td>
                                        {showAggregateColumn && (
                                            <td data-label="Total Late Count (All Time)">
                                                {aggregateCounts[student.student_name] || 0}
                                            </td>
                                        )}
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
    const tableRef = useRef<HTMLTableElement>(null);

    const [department, setHodDepartment] = useState<string>('');
    
    // Filter states
    const [filterMode, setFilterMode] = useState<string>('today');
    const [specificDate, setSpecificDate] = useState<string>('');
    const [batches, setBatches] = useState<number[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>('All');

    // New states for Date Range filter
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showDateRange, setShowDateRange] = useState<boolean>(false);
    
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

    // Handler for filter mode change (dropdown)
    const handleFilterModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newFilterMode = event.target.value;
        setFilterMode(newFilterMode);
        
        // Reset date fields when mode changes
        if (newFilterMode !== 'specificDate') setSpecificDate('');
        
        // Show date range inputs for weekly and monthly
        if (newFilterMode === 'weekly' || newFilterMode === 'monthly') {
            setShowDateRange(true);
            setPredefinedDateRange(newFilterMode);
        } else {
            setShowDateRange(false);
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
        // Don't change filterMode when selecting batch
    };

    // Function to set date range for predefined periods (weekly, monthly)
    const setPredefinedDateRange = (period: string) => {
        const today = new Date();
        const startDate = new Date();
        
        switch(period) {
            case 'weekly':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(today.getMonth() - 1);
                break;
            default:
                return;
        }
        
        setStartDate(startDate.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    };

    // Function to export table as PDF
    const exportToPDF = () => {
        if (!tableRef.current) return;
        
        const doc = new jsPDF();
        const title = `Latecomers Report - ${getCardTitle()}`;
        
        // Add title
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        
        // Add department and date info
        doc.setFontSize(12);
        doc.text(`Department: ${department}`, 14, 25);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
        
        // Extract table data
        const table = tableRef.current;
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent || '');
        
        const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
            Array.from(tr.querySelectorAll('td')).map(td => td.textContent || '')
        );
        
        // Generate PDF table
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [85, 226, 107] }
        });
        
        // Save the PDF
        doc.save(`latecomers-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // Function to export table as Excel
    const exportToExcel = () => {
        if (!tableRef.current) return;
        
        try {
            // Extract table data
            const table = tableRef.current;
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent || '');
            
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
                Array.from(tr.querySelectorAll('td')).map(td => td.textContent || '')
            );
            
            // Prepare worksheet data
            const worksheetData = [headers, ...rows];
            
            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Latecomers Report");
            
            // Generate Excel file and download
            const fileName = `latecomers-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Failed to export to Excel. Please try again.");
        }
    };

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
        // Get today's date and time information for comparison
        const now = new Date();
        
        // Create a Date object for the beginning of the local day (midnight)
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // Define the date range if in dateRange mode
        const startDateObj = start ? new Date(start) : null;
        const endDateObj = end ? new Date(end) : null;

        return arrivals.filter(arrival => {
            const arrivalDate = new Date(arrival.timestamp).toISOString().split('T')[0];
            const arrivalDateObj = new Date(arrival.timestamp);
            
            let dateMatch = false;
            
            if (mode === 'today') {
                // FIX: Check if the arrival timestamp is greater than or equal to today's midnight (local time)
                // This correctly handles timezone differences and ensures "today" means since local midnight.
                dateMatch = arrivalDateObj.getTime() >= todayMidnight.getTime();
                
            } else if (mode === 'specificDate' && date) {
                dateMatch = arrivalDate === date;
            } else if (mode === 'weekly' || mode === 'monthly' || mode === 'dateRange') {
                if (startDateObj && endDateObj) {
                    // Set end date to end of day for inclusive comparison
                    const endDateInclusive = new Date(endDateObj);
                    endDateInclusive.setHours(23, 59, 59, 999);
                    dateMatch = arrivalDateObj >= startDateObj && arrivalDateObj <= endDateInclusive;
                } else if (startDateObj) {
                    // Only start date provided
                    dateMatch = arrivalDateObj >= startDateObj;
                } else if (endDateObj) {
                    // Only end date provided
                    const endDateInclusive = new Date(endDateObj);
                    endDateInclusive.setHours(23, 59, 59, 999);
                    dateMatch = arrivalDateObj <= endDateInclusive;
                } else {
                    // No dates provided, show all
                    dateMatch = true;
                }
            } else if (mode === 'all') {
                dateMatch = true;
            }

            // Filter by batch - handle 'All' option and numeric comparison
            const batchMatch = batch === 'All' || arrival.batch.toString() === batch;
            
            return dateMatch && batchMatch;
        });
    };

    // --- CHART DATA PROCESSING ---

    // Prepare data for the chart (daily counts for the past 7 days) for Today/Specific Date mode
    const getDailyChartData = (arrivals: LateArrival[]) => {
        const dailyCounts: { [date: string]: number } = {};
        const today = new Date();
        
        // Calculate the date 7 days ago (start of the filtering window)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the day 7 days ago

        // Initialize last 7 days with zero counts
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            dailyCounts[dateString] = 0;
        }

        // Count arrivals for each day
        arrivals.forEach(arrival => {
            const arrivalDateObj = new Date(arrival.timestamp);
            
            // Only process data that falls within the last 7 days (since 7 days ago midnight)
            if (arrivalDateObj.getTime() >= sevenDaysAgo.getTime()) { 
                const arrivalDate = arrivalDateObj.toISOString().split('T')[0];
                if (dailyCounts.hasOwnProperty(arrivalDate)) {
                    dailyCounts[arrivalDate]++;
                }
            }
        });

        // Convert to array and format for chart
        return Object.keys(dailyCounts).map(date => {
            const d = new Date(date);
            const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return {
                date: formattedDate,
                latecomers: dailyCounts[date],
            };
        });
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

    const chartData = (filterMode === 'weekly' || filterMode === 'monthly' || filterMode === 'dateRange') 
        ? getTopLatecomersChartData(filteredStudents)
        : getDailyChartData(filteredStudents);

    if (loading) {
        return (
            <div className="hod-dashboard flex items-center justify-center min-h-screen">
                <p className="hod-loading-message">Loading HOD dashboard data...</p>
            </div>
        );
    }

    // --- DISPLAY LOGIC ---
    const getCardTitle = () => {
        switch(filterMode) {
            case 'today':
                // For 'today', get the actual current date for the card title
                const now = new Date();
                const todayFormatted = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                return `Today (${todayFormatted})`;
            case 'specificDate':
                return specificDate || 'Specific Date';
            case 'weekly':
                return 'Last Week';
            case 'monthly':
                return 'Last Month';
            case 'dateRange':
                if (startDate && endDate) {
                    return `${startDate} to ${endDate}`;
                } else if (startDate) {
                    return `From ${startDate}`;
                } else if (endDate) {
                    return `Until ${endDate}`;
                } else {
                    return 'All Dates';
                }
            case 'all':
                return 'All Records';
            default:
                return 'All Records';
        }
    };

    const cardTitle = getCardTitle();
    const totalLatecomers = filteredStudents.length;
    const isDateRangeMode = filterMode === 'weekly' || filterMode === 'monthly' || filterMode === 'dateRange';
    const showAggregateColumn = filterMode === 'all';
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
        '#F8BBD0'  // Light Rose
    ];

    return (
        <div className="hod-dashboard">
            <header className="hod-dashboard-header">
                <h1 className="hod-dashboard-title">HOD Dashboard: {department}</h1>
                <div className="hod-header-actions">
                    <span className="text-gray-700 font-medium mr-4">Welcome , {user?.department} HOD</span>
                    <button className="hod-logout-button" onClick={logout}>Logout</button>
                </div>
            </header>
            
            <section className="hod-dashboard-filters">
                <div className="hod-filter-box">
                    <label htmlFor="date-filter">Filter By:</label>
                    <select id="date-filter" value={filterMode} onChange={handleFilterModeChange}>
                        <option value="today">Today</option>
                        <option value="specificDate">Specific Date</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="all">All Records</option>
                    </select>
                </div>
                {filterMode === 'specificDate' && (
                    <div className="hod-filter-box">
                        <label htmlFor="date-input">Select Date:</label>
                        <input
                            id="date-input"
                            type="date"
                            value={specificDate}
                            onChange={handleSpecificDateChange}
                        />
                    </div>
                )}
                {showDateRange && (
                    <>
                        <div className="hod-filter-box">
                            <label htmlFor="start-date-input">Start Date:</label>
                            <input
                                id="start-date-input"
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                            />
                        </div>
                        <div className="hod-filter-box">
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
                <div className="hod-filter-box">
                    <label htmlFor="batch-filter">Filter By Batch:</label>
                    <select id="batch-filter" value={selectedBatch} onChange={handleBatchChange}>
                        <option value="All">All</option>
                        {batches.map(batch => (
                            <option key={batch} value={batch.toString()}>
                                {batch}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="hod-dashboard-summary-grid">
                <div className="hod-summary-card">
                    <p className="hod-card-label">Total Latecomers ({cardTitle})</p>
                    <h2 className="hod-card-value">{totalLatecomers}</h2>
                </div>
            </section>
            
            <section className="hod-dashboard-chart-section">
                <h3 className="hod-section-title">
                    {isDateRangeMode ? "Top 5 Latecomers (Selected Range)" : "Latecomers (Last 7 Days)"}
                </h3>
                <div className="hod-chart-container-bar">
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
                                
                                {/* 🎯 FIX: Replacing single <Bar> with map for multi-color support */}
                                {/* {chartData.map((entry, index) => (
                                    <Bar 
                                        key={`bar-${index}`}
                                        dataKey="latecomers" 
                                        data={[entry]} // Pass individual data point
                                        fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} 
                                        name={isDateRangeMode ? entry.name : entry.date} 
                                    />
                                ))} */}
                                <Bar dataKey="latecomers" name="Latecomers">
  {chartData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
  ))}
</Bar>

                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="hod-no-data-message">No latecomer data available for the selected period.</p>
                    )}
                </div>
            </section>

            <section className="hod-recent-latecomers-section">
                <div className="hod-section-header">
                    <h3 className="hod-section-title">Latecomers Details ({cardTitle})</h3>
                    <div className="hod-download-buttons">
                        <button className="hod-download-pdf-btn" onClick={exportToPDF}>
                            Download PDF
                        </button>
                        <button className="hod-download-excel-btn" onClick={exportToExcel}>
                            Download Excel
                        </button>
                    </div>
                </div>
                <StudentTable 
                    students={filteredStudents} 
                    isDateRangeMode={isDateRangeMode} 
                    showAggregateColumn={showAggregateColumn}
                    allStudents={students}
                    tableRef={tableRef}
                />
            </section>

            {error && (
                <div className="hod-error-message">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default LatecomersPage;