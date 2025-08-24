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

    // ADDED: State for local batch filter
    const [selectedDepartmentBatch, setSelectedDepartmentBatch] = useState<string | 'All'>('All');
    const [departmentBatchOptions, setDepartmentBatchOptions] = useState<(string | 'All')[]>(['All']);

    // Get the correct filter mode and dates from state, with fallbacks
    const filterMode = filterDateInfo?.mode || 'currentDay';
    const specificDate = filterDateInfo?.specificDate || '';
    const startDate = filterDateInfo?.startDate || '';
    const endDate = filterDateInfo?.endDate || '';
    const initialSelectedUgPg = selectedUgPg || 'All'; // Use UG/PG from PrincipalDashboard if available

    // Helper to format date to YYYY-MM-DD
    const formatDateToISO = (date: Date): string => date.toISOString().split('T')[0];

    const getDisplayTitle = (): string => {
        if (filterMode === 'weekly' && startDate && endDate) return `Weekly (${startDate} to ${endDate})`;
        if (filterMode === 'monthly' && startDate && endDate) {
            const month = new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            return `Monthly (${month})`;
        }
        if (specificDate) return specificDate;
        return 'Today'; // Default case
    };

    useEffect(() => {
        if (!allLateArrivalsData) {
            setIsLoading(false);
            return;
        }

        const urlDeptNameFormatted = decodeURIComponent(departmentName || '').toLowerCase().replace(/-/g, ' '); 

        // 1. Filter by Department and UG/PG (from PrincipalDashboard)
        const departmentAndUgPgFilteredData = allLateArrivalsData.filter(student =>
            student.department.toLowerCase().trim() === urlDeptNameFormatted &&
            (initialSelectedUgPg === 'All' || student.ugpg === initialSelectedUgPg)
        );

        // Populate batch options for the current department and UG/PG filter
        // Only show batches relevant to the current department and UG/PG selection
        const uniqueBatches = Array.from(new Set(departmentAndUgPgFilteredData.map(arrival => arrival.batch)));
        setDepartmentBatchOptions(['All', ...uniqueBatches.sort((a, b) => String(a).localeCompare(String(b)))]);
        
        // Ensure selectedDepartmentBatch is valid for current options, reset if not
        if (selectedDepartmentBatch !== 'All' && !uniqueBatches.includes(selectedDepartmentBatch)) {
             setSelectedDepartmentBatch('All');
        }


        // 2. Filter by local Batch selection
        const batchFilteredData = departmentAndUgPgFilteredData.filter(student =>
            selectedDepartmentBatch === 'All' || student.batch === selectedDepartmentBatch
        );

        // 3. Filter by the selected date range
        const dateFilteredData = batchFilteredData.filter(arrival => {
            const arrivalDate = new Date(arrival.timestamp);
            const arrivalDateISO = formatDateToISO(arrivalDate);
            
            if (filterMode === 'specificDate' && specificDate) {
                return arrivalDateISO === specificDate;
            } else if ((filterMode === 'weekly' || filterMode === 'monthly') && startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Ensure end date is inclusive
                return arrivalDate >= start && arrivalDate < end;
            } else if (filterMode === 'currentDay') {
                const latestDashboardDate = allLateArrivalsData.reduce((latest, current) => {
                    const currentDate = new Date(current.timestamp);
                    return latest && latest.getTime() > currentDate.getTime() ? latest : currentDate;
                }, new Date(0));
                const filterDateISO = latestDashboardDate ? formatDateToISO(latestDashboardDate) : '';
                return arrivalDateISO === filterDateISO;
            }
            return false;
        });

        // Now, process the data based on the current sort method
        let finalDisplayedStudents: DisplayStudent[] = [];

        if (sortBy === 'aggregate') {
            const studentCounts = new Map<string, { count: number; department: string; batch: string; ugpg: string }>(); 
            // Use batchFilteredData for aggregate count to respect batch filter
            batchFilteredData.forEach(entry => { 
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
                isLateOnSelectedDate: false, // Not relevant for this view
                lateArrivalTime: null, // Not relevant for this view
                lateCountAggregate: data.count,
            })).sort((a, b) => b.lateCountAggregate - a.lateCountAggregate || a.student_name.localeCompare(b.student_name));

        } else if (sortBy === 'today') {
            const uniqueStudentsMap = new Map<string, DisplayStudent>();
            dateFilteredData.forEach(student => {
                const latestTime = new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                // Calculate aggregate late count for this student across the entire department and batch
                const lateCount = batchFilteredData.filter(s => s.student_name === student.student_name).length;
                
                uniqueStudentsMap.set(student.student_name, {
                    student_name: student.student_name,
                    department: student.department,
                    batch: student.batch,
                    ugpg: student.ugpg,
                    isLateOnSelectedDate: true,
                    lateArrivalTime: latestTime,
                    lateCountAggregate: lateCount,
                });
            });

            finalDisplayedStudents = Array.from(uniqueStudentsMap.values());
            finalDisplayedStudents.sort((a, b) => {
                const timeA = a.lateArrivalTime ? new Date(`1970-01-01T${a.lateArrivalTime}`).getTime() : 0;
                const timeB = b.lateArrivalTime ? new Date(`1970-01-01T${b.lateArrivalTime}`).getTime() : 0;
                return timeA - timeB; // Sort by time ascending
            });
        }

        setDisplayedStudents(finalDisplayedStudents);
        setIsLoading(false);

    }, [allLateArrivalsData, departmentName, filterDateInfo, initialSelectedUgPg, selectedDepartmentBatch, sortBy]);
    
    const handleSortByChange = (sortType: 'today' | 'aggregate') => {
        setSortBy(sortType);
        setShowSortOptions(false);
    };

    // Handler for local batch filter change
    const handleDepartmentBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDepartmentBatch(event.target.value);
    };

    // The new function to handle PDF download
    const handleDownloadPDF = async () => {
        if (tableRef.current) {
            const canvas = await html2canvas(tableRef.current, {
                scale: 2, // Increase scale for better quality
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; 
            const pageHeight = 297;  
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add the first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add new pages for multi-page content
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

    return (
        <div className="latecomers-container">
            <header className="latecomers-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    &larr; Back
                </button>
                <h1 className="page-title">
                    {decodeURIComponent(departmentName).replace(/-/g, ' ')}
                </h1>
                <div className="button-group">
                    {/* Filter by Batch dropdown */}
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

                    {/* Download as PDF button, styled to match the select dropdown */}
                    <button onClick={handleDownloadPDF} className="download-button-styled">
                        <span className="icon">⬇️</span> Download as PDF
                    </button>
                    
                    {/* Sort Options menu */}
                    <div className="sort-menu-container">
                        <button onClick={() => setShowSortOptions(!showSortOptions)} className="menu-icon-button">
                            &#9776;
                        </button>
                        {showSortOptions && (
                            <div className="sort-options-dropdown">
                                <button 
                                    onClick={() => handleSortByChange('today')} 
                                    className={`sort-button ${sortBy === 'today' ? 'active' : ''}`}
                                >
                                    Latecomers ({getDisplayTitle()})
                                </button>
                                <button 
                                    onClick={() => handleSortByChange('aggregate')} 
                                    className={`sort-button ${sortBy === 'aggregate' ? 'active' : ''}`}
                                >
                                    Highest Late Count (Overall)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {isLoading ? (
                <p className="loading-message">Loading students data...</p>
            ) : (
                <div className="students-table-container" ref={tableRef}>
                    {displayedStudents.length === 0 ? (
                        <p className="no-data-message">No latecomers found for {decodeURIComponent(departmentName).replace(/-/g, ' ')} for this period.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Batch</th>
                                    <th>UG/PG</th> {/* Display UG/PG header */}
                                    {sortBy === 'today' && <th>Late Arrival Time</th>}
                                    <th>Late Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedStudents.map((student, index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{student.student_name}</td>
                                        <td data-label="Batch">{student.batch}</td>
                                        <td data-label="UG/PG">{student.ugpg}</td> {/* Display UG/PG data */}
                                        {sortBy === 'today' && <td data-label="Late Arrival Time">{student.lateArrivalTime || 'N/A'}</td>}
                                        <td data-label="Late Count">{student.lateCountAggregate}</td>
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
