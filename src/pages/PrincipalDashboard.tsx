import React, { useState, useEffect, useMemo } from 'react';
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
// Assuming this path is correct for your project
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

// Interface for the aggregated student detail view (The new feature)
interface StudentDetail {
    name: string;
    department: string;
    batch: string;
    ugpg: string;
    totalLateEntries: number;
    uniqueLateDays: number;
    fullLateHistory: { date: string; time: string; fullTimestamp: string }[];
}


// Utility function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Utility function to format timestamp for display
const formatTimestamp = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateOnly = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}


// ***************************************************************
// ** SEARCHED STUDENT DETAIL MODAL COMPONENT (NEW FEATURE - UPDATED) **
// ***************************************************************

const SearchedStudentDetailModal: React.FC<{
    studentDetail: StudentDetail | null,
    onClose: () => void,
    searchQuery: string
}> = ({ studentDetail, onClose, searchQuery }) => {

    const handlePrintStudentDetailPdf = async () => {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            console.error("html2canvas or jspdf library not loaded.");
            alert("PDF generation libraries not loaded. Please ensure internet connectivity and check script tags for html2canvas and jspdf.");
            return;
        }

        const input = document.getElementById('student-detail-modal-content');
        if (!input || !studentDetail) {
            alert("Could not find the student detail content to generate PDF.");
            return;
        }

        try {
            // Temporarily set overflow to visible for capturing the full scrollable content
            const originalOverflow = input.style.overflow;
            input.style.overflow = 'visible';

            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                // Ensure the canvas captures the entire content height
                windowWidth: input.scrollWidth,
                windowHeight: input.scrollHeight 
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

            pdf.save(`${studentDetail.name}_Late_Attendance_Record.pdf`);

        } catch (error) {
            console.error("Error generating student PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            // Restore original overflow
            if (input) {
                input.style.overflow = originalOverflow;
            }
        }
    };


    if (!studentDetail) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                    <h3 className="modal-title">Student Search Results 🔍</h3>
                    <p className="no-data-message-centered">
                        No student found matching **"{searchQuery}"** in the complete record.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header-container">
                    <h3 className="modal-title">Late Attendance Record 📝</h3>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body-content" id="student-detail-modal-content">

                    <div className="student-detail-header">
                        <h4 className="student-name-heading">{studentDetail.name}</h4>
                        <button 
                            onClick={handlePrintStudentDetailPdf}
                            className="download-pdf-button-modal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                            </svg>
                            Download PDF
                        </button>
                    </div>
                
                    <div className="student-summary-grid">
                        <p><strong>Department:</strong> {studentDetail.department}</p>
                        <p><strong>Batch:</strong> {studentDetail.batch}</p>
                        <p><strong>UG/PG:</strong> {studentDetail.ugpg}</p>
                        <p><strong>Total Late Entries:</strong> {studentDetail.totalLateEntries}</p>
                        <p><strong>Unique Late Days:</strong> {studentDetail.uniqueLateDays}</p>
                    </div>

                    <h4 className="history-title">Full Late History (Total: {studentDetail.totalLateEntries} entries)</h4>
                    <div className="late-history-table-container">
                        <table className="recent-latecomers-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Late Arrival Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentDetail.fullLateHistory
                                    .sort((a, b) => new Date(b.fullTimestamp).getTime() - new Date(a.fullTimestamp).getTime())
                                    .map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.date}</td>
                                        <td>{entry.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ***************************************************************
// ** RECENT LATE ENTRIES COMPONENT **
// ***************************************************************

const RecentLateEntries: React.FC<{
    entries: DjangoLateArrival[],
    filterMode: string,
    totalLatecomers: number,
    dateDisplayString: string
}> = ({ entries, filterMode, dateDisplayString }) => {
    
    // Internal search is kept here for filtering the already globally-filtered list.
    const [searchQuery, setSearchQuery] = useState('');

    /**
     * Filters entries based on the current internal search query (secondary to the global one).
     */
    const getSearchFilteredEntries = (allEntries: DjangoLateArrival[]): DjangoLateArrival[] => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            return allEntries;
        }
        return allEntries.filter(entry =>
            entry.student_name.toLowerCase().includes(query) ||
            entry.department.toLowerCase().includes(query) ||
            entry.batch.toLowerCase().includes(query)
        );
    };

    const searchFilteredEntries = getSearchFilteredEntries(entries);

    const displayTableRows = () => {
        const dataToDisplay = searchFilteredEntries;

        if (filterMode === 'currentDay') {
            // Show latest arrival time for unique students
            const uniqueStudentsMap = new Map<string, DjangoLateArrival>();
            dataToDisplay.forEach(entry => {
                const existing = uniqueStudentsMap.get(entry.student_name);
                if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
                    uniqueStudentsMap.set(entry.student_name, entry);
                }
            });

            return Array.from(uniqueStudentsMap.values())
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map((entry, index) => (
                    <tr key={index}>
                        <td data-label="Student Name">{entry.student_name}</td>
                        <td data-label="Department">{entry.department}</td>
                        <td data-label="Batch">{entry.batch}</td>
                        <td data-label="UG/PG">{entry.ugpg}</td>
                        <td data-label="Late Arrival Time">{formatTimestamp(entry.timestamp)}</td>
                    </tr>
                ));
        } else {
            // Show aggregate count for unique students
            const studentPeriodCounts = new Map<string, { count: number; batch: string; ugpg: string; department: string }>();

            dataToDisplay.forEach(entry => {
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
                        <td data-label="Late Count">{data.count}</td>
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
        
        // Temporarily hide search bar for clean PDF generation
        const searchInputContainer = input.querySelector('.table-search-position') as HTMLElement;
        const originalSearchDisplay = searchInputContainer ? searchInputContainer.style.display : null;
        if (searchInputContainer) {
            searchInputContainer.style.display = 'none';
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
            if (searchInputContainer && originalSearchDisplay !== null) {
                // Restore search bar display after PDF generation
                searchInputContainer.style.display = originalSearchDisplay; 
            }
        }
    };

    // Determine which columns to show in the header
    const showLateArrivalTime = filterMode === 'currentDay';
    const showLateCount = filterMode !== 'currentDay';


    return (
        <section className="recent-latecomers-section">
            <h3 className="section-title">Recent Late Entries ({dateDisplayString})</h3>
            <div className="header-actions" style={{ marginBottom: '15px' }}>
                <button
                    onClick={handlePrintPdf}
                    className="download-pdf-button"
                >
                    Download as PDF
                </button>
            </div>
            <div id="recent-late-entries-table-section" className="recent-entries-table-container">

                {/* Internal Search (Optional, for filtering within the current filtered list) */}
                <div className="search-input-container table-search-position">
                    <input 
                        type="text" 
                        placeholder="Filter list..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') setSearchQuery(e.currentTarget.value);
                        }}
                    />
                    <button 
                        onClick={() => { /* State change handles it */}}
                        className="search-button-styled"
                    >
                        Filter
                    </button>
                </div>

                {entries.length > 0 && searchFilteredEntries.length === 0 ? (
                    <p className="no-data-message">No entries found matching "{searchQuery}" in the current period.</p>
                ) : (entries.length > 0 ? (
                    <table className="recent-latecomers-table">
                        <thead>
                            <tr>
                                <th>STUDENT NAME</th>
                                <th>DEPARTMENT</th>
                                <th>BATCH</th>
                                <th>UG/PG</th>
                                {showLateArrivalTime && <th>LATE ARRIVAL TIME</th>}
                                {showLateCount && <th>LATE COUNT</th>}
                            </tr>
                        </thead>
                        <tbody>{displayTableRows()}</tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No recent late entries available for this period.</p>
                ))}
            </div>
        </section>
    );
};


// ***************************************************************
// ** UTILITY FUNCTIONS **
// ***************************************************************
const shortenDepartmentName = (name: string): string => {
    const trimmedName = name.trim();
    const words = trimmedName.split(/[\s-]+/).filter(w => w.length > 0);

    if (words.length > 1) {
        const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
        return initials.length <= 5 ? initials : initials.substring(0, 5);
    }

    const MAX_LENGTH_BEFORE_TRUNCATE = 5;
    if (trimmedName.length > MAX_LENGTH_BEFORE_TRUNCATE) {
        return trimmedName.substring(0, 3) + '.';
    }

    return trimmedName;
};

// ***************************************************************
// ** PRINCIPAL DASHBOARD COMPONENT **
// ***************************************************************

const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, logout } = useAuthStore();

    // --- Filter States ---
    const [filterMode, setFilterMode] = useState<string>('currentDay'); 
    const [specificDate, setSpecificDate] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    
    // Global Search States (REMAINS THE SAME)
    const [globalSearchQuery, setGlobalSearchQuery] = useState<string>(''); 
    const [searchedStudentDetail, setSearchedStudentDetail] = useState<StudentDetail | null>(null);
    const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);

    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [departments, setDepartments] = useState<string[]>(['All']);

    const [selectedUgPg, setSelectedUgPg] = useState<string | 'All'>('All');
    const [ugpgOptions, setUgPgOptions] = useState<(string | 'All')[]>(['All']);

    // --- Data States ---
    const [principalDashboardDjangoData, setPrincipalDashboardDjangoData] = useState<PrincipalDashboardDjangoData | null>(null);
    const [isLoadingPrincipalDashboardDjangoData, setIsLoadingPrincipalDashboardDjangoData] = useState(true);
    const [errorPrincipalDashboardDjango, setErrorPrincipalDashboardDjango] = useState<string | null>(null);

    // --- Date Utilities (REMAINS THE SAME) ---
    const formatDateToISO = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateToDisplay = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).replace(/ /g, '-');
    };

    const getStartOfLastWeek = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        d.setDate(diff - 7);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const getEndOfLastWeek = (date: Date): Date => {
        const d = new Date(getStartOfLastWeek(date));
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

    // --- Handlers (REMAINS THE SAME) ---
    const handleFilterModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const mode = event.target.value;
        setFilterMode(mode);
        const now = new Date();
        setSpecificDate('');
        setStartDate('');
        setEndDate('');

        if (mode === 'weekly') {
            setStartDate(formatDateToISO(getStartOfLastWeek(now)));
            setEndDate(formatDateToISO(getEndOfLastWeek(now)));
        } else if (mode === 'monthly') {
            setStartDate(formatDateToISO(getStartOfMonth(now)));
            setEndDate(formatDateToISO(getEndOfMonth(now)));
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

    /**
     * Logic for Global Search (Student Detail Feature) - REMAINS THE SAME
     */
    const handleGlobalSearchApply = () => {
        const searchTerms = globalSearchQuery.trim().toLowerCase();
        
        // Close modal if search is cleared
        if (!searchTerms) {
            setSearchedStudentDetail(null);
            setShowStudentDetailModal(false);
            return;
        }

        if (principalDashboardDjangoData) {
            const matchingEntries = principalDashboardDjangoData.late_arrivals.filter(arrival =>
                arrival.student_name.toLowerCase().includes(searchTerms) ||
                arrival.batch.toLowerCase().includes(searchTerms)
            );

            if (matchingEntries.length > 0) {
                // Assuming we track one student at a time, use the first match for details
                const firstEntry = matchingEntries[0];
                const fullHistory = matchingEntries.map(entry => ({
                    date: formatDateOnly(entry.timestamp),
                    time: formatTimestamp(entry.timestamp),
                    fullTimestamp: entry.timestamp,
                }));

                const uniqueDays = Array.from(new Set(fullHistory.map(h => h.date))).length;

                const studentDetail: StudentDetail = {
                    name: firstEntry.student_name,
                    department: firstEntry.department,
                    batch: firstEntry.batch,
                    ugpg: firstEntry.ugpg,
                    totalLateEntries: matchingEntries.length,
                    uniqueLateDays: uniqueDays,
                    fullLateHistory: fullHistory,
                };

                setSearchedStudentDetail(studentDetail);
                setShowStudentDetailModal(true);
            } else {
                setSearchedStudentDetail(null);
                setShowStudentDetailModal(true); // Show modal with "No data found" message
            }
        } else {
            setSearchedStudentDetail(null);
            setShowStudentDetailModal(true); // Show modal, possibly with a message about data loading
        }
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

    // --- Effects (API and Authentication) (REMAINS THE SAME) ---
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user && user.role !== 'Principal') {
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

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

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
                setPrincipalDashboardDjangoData(data);

                // Dynamically populate departments from API data
                const uniqueDepartments = Array.from(new Set(data.late_arrivals.map(arrival => arrival.department)));
                setDepartments(['All', ...uniqueDepartments]);

                const uniqueUgPg = Array.from(new Set(data.late_arrivals.map(arrival => arrival.ugpg)));
                setUgPgOptions(['All', ...uniqueUgPg.sort((a, b) => String(a).localeCompare(String(b)))]);

                const now = new Date();
                // Initialize filters based on the default state
                if (filterMode === 'weekly') {
                    setStartDate(formatDateToISO(getStartOfLastWeek(now)));
                    setEndDate(formatDateToISO(getEndOfLastWeek(now)));
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

    /**
     * Data Filtering Logic: APPLIES ONLY TO MAIN DASHBOARD (Chart/Table) - REMAINS THE SAME
     */
    const filterLateArrivals = (arrivals: DjangoLateArrival[]) => {
        // Global search is handled via the modal, so we ignore it here
        const searchTerms = ''; 

        // Step 1: Filter by Global Search (Ignored for main dashboard, left structure for consistency)
        let dataAfterSearch: DjangoLateArrival[] = arrivals;

        // Step 2: Apply Date/Mode Filters
        if (filterMode === 'completeRecord') {
            return dataAfterSearch.filter(arrival => {
                const isWithinDepartment = selectedDepartment === 'All' ||
                    arrival.department.toLowerCase().trim() === selectedDepartment.toLowerCase().trim();
                const isWithinUgPg = selectedUgPg === 'All' || arrival.ugpg === selectedUgPg;
                return isWithinDepartment && isWithinUgPg;
            });
        }

        // Apply Date-based filters
        const startFilterDate = startDate ? new Date(startDate) : null;
        const endFilterDate = endDate ? new Date(endDate) : null;
        const todayISO = formatDateToISO(new Date());

        return dataAfterSearch.filter(arrival => {
            const arrivalDateTime = new Date(arrival.timestamp);
            const arrivalDateOnlyISO = formatDateToISO(arrivalDateTime);

            let isWithinDateRange = false;
            if (filterMode === 'currentDay') {
                isWithinDateRange = arrivalDateOnlyISO === todayISO;
            } else if (filterMode === 'specificDate' && specificDate) {
                isWithinDateRange = arrivalDateOnlyISO === specificDate;
            } else if ((filterMode === 'weekly' || filterMode === 'monthly') && startFilterDate && endFilterDate) {
                const adjustedEndFilterDate = new Date(endFilterDate);
                adjustedEndFilterDate.setHours(23, 59, 59, 999); 
                const adjustedStartFilterDate = new Date(startFilterDate);
                adjustedStartFilterDate.setHours(0, 0, 0, 0);

                isWithinDateRange = arrivalDateTime.getTime() >= adjustedStartFilterDate.getTime() && arrivalDateTime.getTime() <= adjustedEndFilterDate.getTime();
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

    const lateStudentsCount = filterMode === 'currentDay'
        ? Array.from(new Set(filteredLateArrivals.map(a => a.student_name))).length
        : filteredLateArrivals.length > 0
            ? Array.from(new Set(filteredLateArrivals.map(a => a.student_name))).length
            : 0;

    // --- Chart Data Calculation (REMAINS THE SAME) ---
    const departmentLatecomersData = useMemo(() => {
        const allDepartmentNames = departments.filter(d => d !== 'All');
        const departmentStudentCounts: { [key: string]: Set<string> } = {};

        allDepartmentNames.forEach(dept => {
            departmentStudentCounts[dept] = new Set<string>();
        });

        filteredLateArrivals.forEach(arrival => {
            const departmentName = arrival.department;
            if (departmentStudentCounts.hasOwnProperty(departmentName)) {
                departmentStudentCounts[departmentName].add(arrival.student_name);
            }
        });
        
        let data = Object.keys(departmentStudentCounts).map(dept => ({
            department: dept,
            latecomers: departmentStudentCounts[dept].size,
        }));

        let nonZeroData = data.filter(d => d.latecomers > 0);
        let zeroData = data.filter(d => d.latecomers === 0);

        nonZeroData.sort((a, b) => b.latecomers - a.latecomers);

        const MAX_DEPARTMENTS_TO_DISPLAY = 10;

        if (nonZeroData.length >= MAX_DEPARTMENTS_TO_DISPLAY) {
            return nonZeroData.slice(0, MAX_DEPARTMENTS_TO_DISPLAY);
        }

        const requiredEmptySpots = MAX_DEPARTMENTS_TO_DISPLAY - nonZeroData.length;
        const shuffledZeroData = shuffleArray(zeroData);

        const fillerData = shuffledZeroData.slice(0, requiredEmptySpots);

        return [...nonZeroData, ...fillerData];
    }, [filteredLateArrivals, departments]);

    // --- Display Info Calculation (REMAINS THE SAME) ---
    const getDisplayDateInfo = (): string => {
        if (filterMode === 'completeRecord') {
            return `Complete Record`;
        }
        if (filterMode === 'currentDay') {
            const latestTimestamp = filteredLateArrivals.reduce((latest, current) => {
                const currentTimestamp = new Date(current.timestamp).getTime();
                return currentTimestamp > latest ? currentTimestamp : latest;
            }, 0);
            
            if (latestTimestamp) {
                const latestDateISO = formatDateToISO(new Date(latestTimestamp));
                return `Latest Record (${formatDateToDisplay(latestDateISO)})`;
            }

            return `Today's Record`;
        } else if (filterMode === 'specificDate' && specificDate) {
            return formatDateToDisplay(specificDate);
        } else if (filterMode === 'weekly' && startDate && endDate) {
            const startDisplay = formatDateToDisplay(startDate);
            const endDisplay = formatDateToDisplay(endDate);
            return `${startDisplay} to ${endDisplay}`;
        } else if (filterMode === 'monthly' && startDate && endDate) {
            const month = new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            return `Month of ${month}`;
        }
        return `Today's Record`;
    };

    const recentLateEntriesForDisplay = () => {
        return filteredLateArrivals;
    };


    const PASTEL_COLORS = [
        '#AEC6CF', '#B3E0C9', '#FDD49E', '#E6B3B3', '#C2B2D8', 
        '#D5F0F6', '#D0E0E3', '#F6E8DA', '#FAD2E1', '#C7E9B0', 
        '#A7D9D9', '#FFE0B2', '#D1C4E9', '#BBDEFB', '#F8BBD0'
    ];

    const displayDateInfo = getDisplayDateInfo();

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
                        <option value="currentDay">Today's Record</option>
                        <option value="weekly">Last Week</option>
                        <option value="monthly">Current Month</option>
                        <option value="specificDate">Specific Date</option>
                        <option value="completeRecord">Complete Record (All Time)</option>
                    </select>
                </div>
                
                {/* GLOBAL SEARCH FEATURE (Now triggers modal) */}
                <div className="filter-box search-box">
                    <label htmlFor="global-search">Search Student</label>
                    <div className="search-input-group">
                        <input
                            id="global-search"
                            type="text"
                            placeholder="Student Name or Batch..."
                            value={globalSearchQuery}
                            onChange={(e) => setGlobalSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleGlobalSearchApply();
                            }}
                        />
                        <button 
                            onClick={handleGlobalSearchApply} 
                            className="search-button-styled"
                        >
                            Search
                        </button>
                    </div>
                </div>
                {/* END OF GLOBAL SEARCH */}
                
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
                    {/* TOTAL LATECOMERS SUMMARY CARD */}
                    <div className="summary-card-container">
                        <section className="summary-card">
                            <h3 className="card-label">Total  Latecomers <br/>({displayDateInfo})</h3>
                            <p className="card-value">{lateStudentsCount}</p>
                        </section>
                    </div>

                    {/* CHART SECTION */}
                    <div className="chart-section-container">
                        <section className="dashboard-chart-section">
                            <h3 className="section-title">Department Latecomers</h3>
                            <div className="chart-container-bar">
                                <ResponsiveContainer width="100%" height={250}>
                                    {departmentLatecomersData.length > 0 ? (
                                        <BarChart
                                            data={departmentLatecomersData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="department"
                                                tickFormatter={shortenDepartmentName}
                                                height={50}
                                                interval={0}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="latecomers" name="Unique Latecomers" onClick={handleBarClick}>
                                                {
                                                    departmentLatecomersData.map((entry, index) => (
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

                    {/* RECENT LATE ENTRIES TABLE SECTION */}
                    <div className="recent-entries-section-container">
                        <RecentLateEntries
                            entries={recentLateEntriesForDisplay()}
                            filterMode={filterMode}
                            totalLatecomers={lateStudentsCount}
                            dateDisplayString={displayDateInfo}
                        />
                    </div>
                </div>
            )}

            {/* Render the new modal if the global search was triggered */}
            {showStudentDetailModal && (
                <SearchedStudentDetailModal
                    studentDetail={searchedStudentDetail}
                    onClose={() => {
                        setShowStudentDetailModal(false);
                        setSearchedStudentDetail(null);
                        setGlobalSearchQuery('');
                    }}
                    searchQuery={globalSearchQuery}
                />
            )}
        </div>
    );
};

export default PrincipalDashboard;