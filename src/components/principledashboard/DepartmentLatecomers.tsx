import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/principaldashboard/DepartmentLatecomers.css';
import jsPDF from 'jspdf'; // Import jsPDF
import html2canvas from 'html2canvas'; // Import html2canvas

// Interface for the fetched late arrival data from the main endpoint
interface LateArrival {
    student_name: string;
    department: string;
    batch: string; // Corrected: Batch is a string like "U5DS2024" based on backend data
    ugpg: string; // Added: UG/PG status as per PrincipalDashboard.tsx
    timestamp: string;
}

// Interface for the data to be displayed in the table, with aggregated info
interface DisplayStudent {
    student_name: string;
    department: string;
    batch: string; // Corrected: Batch is a string
    ugpg: string; // Added: UG/PG status
    isLateOnSelectedDate: boolean;
    lateArrivalTime?: string | null;
    lateCountAggregate: number;
}

const DepartmentLatecomers: React.FC = () => {
    const { departmentName } = useParams<{ departmentName: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Create a ref for the element you want to download as a PDF
    const tableRef = useRef<HTMLDivElement>(null);

    // Destructure all filter data passed from PrincipalDashboard
    const {
        allLateArrivalsData,
        filterDateInfo,
        selectedUgPg // This is now passed from PrincipalDashboard
    } = location.state as {
        allLateArrivalsData?: LateArrival[];
        filterDateInfo?: {
            mode: string;
            specificDate: string;
            startDate: string;
            endDate: string;
        };
        selectedUgPg?: string | 'All'; // Expecting UG/PG now
    } || {};

    const [displayedStudents, setDisplayedStudents] = useState<DisplayStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [sortBy, setSortBy] = useState<'today' | 'aggregate'>('today');
    const [showSortOptions, setShowSortOptions] = useState(false);

    // State for local batch filter
    const [selectedDepartmentBatch, setSelectedDepartmentBatch] = useState<string | 'All'>('All');
    const [departmentBatchOptions, setDepartmentBatchOptions] = useState<(string | 'All')[]>(['All']);

    // STATE FOR SEARCH FUNCTIONALITY
    const [searchQuery, setSearchQuery] = useState('');

    // Get the correct filter mode and dates from state, with fallbacks
    const filterMode = filterDateInfo?.mode || 'currentDay';
    const specificDate = filterDateInfo?.specificDate || '';
    const startDate = filterDateInfo?.startDate || '';
    const endDate = filterDateInfo?.endDate || '';
    const initialSelectedUgPg = selectedUgPg || 'All'; // Use UG/PG from PrincipalDashboard if available

    // Helper to format date to YYYY-MM-DD
    const formatDateToISO = (date: Date): string => date.toISOString().split('T')[0];

    const getDisplayTitle = (): string => {
        // 💡 UPDATED: Handle 'completeRecord' display title
        if (filterMode === 'completeRecord') return `Complete Record (All Time)`;
        if (filterMode === 'weekly' && startDate && endDate) return `Weekly (${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)})`;
        if (filterMode === 'monthly' && startDate && endDate) {
            const month = new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            return `Monthly (${month})`;
        }
        if (specificDate) return formatDateDisplay(specificDate);

        // --- NEW: Display today's actual date for 'currentDay' mode ---
        const today = new Date();
        const todayISO = formatDateToISO(today);
        return formatDateDisplay(todayISO); // Always show today's date for 'currentDay'
    };

    const formatDateDisplay = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).replace(/ /g, '-');
    };

    /**
     * Search Handler: Updates search state, triggering useEffect.
     */
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        // Reset batch and sort for a clean, full-data search view
        setSelectedDepartmentBatch('All');
        setSortBy('aggregate'); // Search results always show aggregate count
    };

    useEffect(() => {
        if (!allLateArrivalsData) {
            setIsLoading(false);
            return;
        }

        const urlDeptNameFormatted = decodeURIComponent(departmentName || '').toLowerCase().replace(/-/g, ' ');

        let processedData: LateArrival[] = allLateArrivalsData;
        let isSearchActive = searchQuery.trim().length > 0;

        // --- Data Filtering Steps ---

        if (isSearchActive) {
            // 1. Search Filter (Overrides Department/Date filters)
            const lowerQuery = searchQuery.toLowerCase().trim();
            processedData = allLateArrivalsData.filter(student =>
                student.student_name.toLowerCase().includes(lowerQuery) ||
                student.batch.toLowerCase().includes(lowerQuery) ||
                student.department.toLowerCase().includes(lowerQuery)
            );
        } else {
            // 1. Filter by Department and UG/PG
            processedData = allLateArrivalsData.filter(student =>
                student.department.toLowerCase().trim() === urlDeptNameFormatted &&
                (initialSelectedUgPg === 'All' || student.ugpg === initialSelectedUgPg)
            );

            // Populate batch options for the current department and UG/PG filter
            const uniqueBatches = Array.from(new Set(processedData.map(arrival => arrival.batch)));
            setDepartmentBatchOptions(['All', ...uniqueBatches.sort((a, b) => String(a).localeCompare(String(b)))]);

            // Ensure selectedDepartmentBatch is valid for current options, reset if not
            if (selectedDepartmentBatch !== 'All' && !uniqueBatches.includes(selectedDepartmentBatch)) {
                setSelectedDepartmentBatch('All');
            }

            // 2. Filter by local Batch selection
            processedData = processedData.filter(student =>
                selectedDepartmentBatch === 'All' || student.batch === selectedDepartmentBatch
            );

            // 3. Filter by the selected date range
            processedData = processedData.filter(arrival => {
                // 💡 NEW LOGIC: If filterMode is 'completeRecord', accept all entries after dept/batch filter
                if (filterMode === 'completeRecord') {
                    return true; // Keep all records for the selected Department/Batch/UGPG
                }

                const arrivalDate = new Date(arrival.timestamp);
                const arrivalDateISO = formatDateToISO(arrivalDate);

                if (filterMode === 'specificDate' && specificDate) {
                    return arrivalDateISO === specificDate;
                } else if ((filterMode === 'weekly' || filterMode === 'monthly') && startDate && endDate) {
                    const start = new Date(startDate);
                    // Adjust end date to include the full day
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return arrivalDate >= start && arrivalDate <= end;
                } else if (filterMode === 'currentDay') {
                    // 🌟 CRITICAL FIX: Use the actual current date for comparison
                    const today = new Date();
                    const filterDateISO = formatDateToISO(today); // Today's date (YYYY-MM-DD)
                    return arrivalDateISO === filterDateISO;
                }
                return false;
            });
        }

        // --- Data Aggregation and Display ---

        let finalDisplayedStudents: DisplayStudent[] = [];

        // Aggregate view is used for:
        // 1. Search results (isSearchActive)
        // 2. Explicitly selected 'aggregate' sort
        // 3. Any range filter, including 'completeRecord'
        if (sortBy === 'aggregate' || isSearchActive || filterMode === 'completeRecord' || filterMode === 'weekly' || filterMode === 'monthly' || filterMode === 'specificDate') {
            
            // Use processedData (date-filtered OR search-filtered) for aggregate count
            const studentCounts = new Map<string, { count: number; department: string; batch: string; ugpg: string }>();

            processedData.forEach(entry => {
                const key = entry.student_name;
                studentCounts.set(key, {
                    count: (studentCounts.get(key)?.count || 0) + 1,
                    department: entry.department,
                    batch: entry.batch,
                    ugpg: entry.ugpg,
                });
            });

            finalDisplayedStudents = Array.from(studentCounts.entries()).map(([name, data]) => ({
                student_name: name,
                department: data.department,
                batch: data.batch,
                ugpg: data.ugpg,
                isLateOnSelectedDate: data.count > 0,
                lateArrivalTime: null, // Aggregate view doesn't need specific time
                lateCountAggregate: data.count,
            })).sort((a, b) => b.lateCountAggregate - a.lateCountAggregate || a.student_name.localeCompare(b.student_name));

        } else if (sortBy === 'today' && !isSearchActive && filterMode === 'currentDay') {
            // "Today" view is ONLY for 'currentDay' filter mode and NOT when search is active
            const uniqueStudentsMap = new Map<string, DisplayStudent>();

            processedData.forEach(student => {
                // Find the latest entry for this student within the filtered (currentDay) data
                const latestEntry = processedData.filter(s => s.student_name === student.student_name)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                if (!uniqueStudentsMap.has(student.student_name) && latestEntry) {
                    const latestTime = new Date(latestEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                    // Count is still the aggregate count for the day
                    const lateCount = processedData.filter(s => s.student_name === student.student_name).length;

                    uniqueStudentsMap.set(student.student_name, {
                        student_name: student.student_name,
                        department: student.department,
                        batch: student.batch,
                        ugpg: student.ugpg,
                        isLateOnSelectedDate: true,
                        lateArrivalTime: latestTime,
                        lateCountAggregate: lateCount,
                    });
                }
            });

            finalDisplayedStudents = Array.from(uniqueStudentsMap.values());
            finalDisplayedStudents.sort((a, b) => {
                const timeA = a.lateArrivalTime ? new Date(`1970-01-01 ${a.lateArrivalTime}`).getTime() : 0;
                const timeB = b.lateArrivalTime ? new Date(`1970-01-01 ${b.lateArrivalTime}`).getTime() : 0;
                return timeA - timeB; // Sort by time ascending
            });
        }

        setDisplayedStudents(finalDisplayedStudents);
        setIsLoading(false);

    }, [allLateArrivalsData, departmentName, filterDateInfo, initialSelectedUgPg, selectedDepartmentBatch, sortBy, searchQuery, filterMode]);


    useEffect(() => {
        // Automatically switch sort mode when filterMode is changed from currentDay to a range/aggregate mode
        if (['completeRecord', 'weekly', 'monthly', 'specificDate'].includes(filterMode)) {
            setSortBy('aggregate');
        } else if (filterMode === 'currentDay' && searchQuery.trim().length === 0) {
            setSortBy('today');
        }
    }, [filterMode, searchQuery]);


    const handleSortByChange = (sortType: 'today' | 'aggregate') => {
        setSortBy(sortType);
        setShowSortOptions(false);
    };

    // Handler for local batch filter change
    const handleDepartmentBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDepartmentBatch(event.target.value);
        // Clear search when changing filters
        setSearchQuery('');
    };

    // The function to handle PDF download (No change here, relies on tableRef)
    const handleDownloadPDF = async () => {
        if (tableRef.current) {
            // Find and temporarily hide the search bar for clean PDF
            const searchContainer = tableRef.current.querySelector('.table-search-position') as HTMLElement;
            const originalSearchDisplay = searchContainer ? searchContainer.style.display : null;
            if (searchContainer) searchContainer.style.display = 'none';

            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                useCORS: true,
            });

            // Restore search bar display
            if (searchContainer && originalSearchDisplay !== null) {
                searchContainer.style.display = originalSearchDisplay;
            }

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const title = `${decodeURIComponent(departmentName).replace(/-/g, ' ')} Latecomers (${getDisplayTitle()})`;
            pdf.save(`${title.replace(/ /g, '_')}.pdf`);
        }
    };

    // Determine table headers based on the active view
    const showLateArrivalTimeColumn = sortBy === 'today' && searchQuery.trim().length === 0 && filterMode === 'currentDay';
    const showLateCountColumn = sortBy === 'aggregate' || searchQuery.trim().length > 0 || filterMode !== 'currentDay';


    return (
        <div className="latecomers-container">
            <header className="latecomers-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    &larr; Back
                </button>
                <h1 className="page-title">
                    {searchQuery.trim() ? `Search Results for "${searchQuery}"` : decodeURIComponent(departmentName).replace(/-/g, ' ')}
                </h1>

                <div className="button-group">
                    {/* Filter by Batch dropdown - Hidden when search is active */}
                    {!searchQuery && (
                        <div className="filter-box batch-filter-in-header">
                            <label htmlFor="department-batches" className="sr-only">Filter by Batch</label>
                            <select id="department-batches" onChange={handleDepartmentBatchChange} value={selectedDepartmentBatch}>
                                {departmentBatchOptions.map(batch => (
                                    <option key={batch} value={batch}>
                                        {batch === 'All' ? 'All Batches' : `Batch ${batch}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Download as PDF button */}
                    <button onClick={handleDownloadPDF} className="download-button-styled">
                        <span className="icon">⬇️</span> Download as PDF
                    </button>

                    {/* Sort Options menu - Hidden when search is active */}
                    {!searchQuery && (
                        <div className="sort-menu-container">
                            <button onClick={() => setShowSortOptions(!showSortOptions)} className="menu-icon-button">
                                &#9776;
                            </button>
                            {showSortOptions && (
                                <div className="sort-options-dropdown">
                                    <button
                                        onClick={() => handleSortByChange('today')}
                                        className={`sort-button ${sortBy === 'today' ? 'active' : ''} ${filterMode !== 'currentDay' ? 'disabled' : ''}`}
                                        disabled={filterMode !== 'currentDay'}
                                    >
                                        Late Arrival Time ({getDisplayTitle()})
                                    </button>
                                    <button
                                        onClick={() => handleSortByChange('aggregate')}
                                        className={`sort-button ${sortBy === 'aggregate' ? 'active' : ''}`}
                                    >
                                        Total Late Count (Selected Period)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {isLoading ? (
                <p className="loading-message">Loading students data...</p>
            ) : (
                <div className="students-table-container" ref={tableRef}>

                    {/* 💡 REPOSITIONED: SEARCH INPUT AND BUTTON (Above the table) */}
                    <div className="search-input-container table-search-position">
                        <input
                            type="text"
                            placeholder="Search student name or batch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch(searchQuery);
                            }}
                        />
                        <button
                            onClick={() => handleSearch(searchQuery)}
                            className="search-button-styled"
                        >
                            Search
                        </button>
                    </div>

                    {displayedStudents.length === 0 ? (
                        <p className="no-data-message">
                            {searchQuery.trim()
                                ? `No student found matching "${searchQuery}" in the late entries data.`
                                : `No latecomers found for ${decodeURIComponent(departmentName).replace(/-/g, ' ')} for this period (${getDisplayTitle()}).`
                            }
                        </p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Batch</th>
                                    <th>UG/PG</th> {/* Display UG/PG header */}
                                    {showLateArrivalTimeColumn && <th>Late Arrival Time</th>}
                                    {showLateCountColumn && <th>Late Count</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {displayedStudents.map((student, index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{student.student_name}</td>
                                        <td data-label="Batch">{student.batch}</td>
                                        <td data-label="UG/PG">{student.ugpg}</td> {/* Display UG/PG data */}
                                        {showLateArrivalTimeColumn && <td data-label="Late Arrival Time">{student.lateArrivalTime || 'N/A'}</td>}
                                        {showLateCountColumn && <td data-label="Late Count">{student.lateCountAggregate}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default DepartmentLatecomers;