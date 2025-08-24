import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/principaldashboard/DepartmentLatecomers.css';
import jsPDF from 'jspdf'; // Import jsPDF
import html2canvas from 'html2canvas'; // Import html2canvas

// Interface for the fetched late arrival data from the main endpoint
interface LateArrival {
    student_name: string;
    department: string;
    batch: number;
    timestamp: string;
}

// Interface for the data to be displayed in the table, with aggregated info
interface DisplayStudent {
    student_name: string;
    department: string;
    batch: number;
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
        selectedBatch: principalSelectedBatch
    } = location.state as { 
        allLateArrivalsData?: LateArrival[];
        filterDateInfo?: {
            mode: string;
            specificDate: string;
            startDate: string;
            endDate: string;
        };
        selectedBatch?: number | 'All';
    } || {};

    const [displayedStudents, setDisplayedStudents] = useState<DisplayStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [sortBy, setSortBy] = useState<'today' | 'aggregate'>('today'); 
    const [showSortOptions, setShowSortOptions] = useState(false);

    // Get the correct filter mode and dates from state, with fallbacks
    const filterMode = filterDateInfo?.mode || 'currentDay';
    const specificDate = filterDateInfo?.specificDate || '';
    const startDate = filterDateInfo?.startDate || '';
    const endDate = filterDateInfo?.endDate || '';
    const selectedBatch = principalSelectedBatch || 'All';
    
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

        // Get ALL data for the selected department and batch, regardless of date
        const departmentFilteredData = allLateArrivalsData.filter(student =>
            student.department.toLowerCase().trim() === urlDeptNameFormatted &&
            (selectedBatch === 'All' || student.batch === selectedBatch)
        );

        // Get data for the selected date range only
        const dateFilteredData = departmentFilteredData.filter(arrival => {
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
            const studentCounts = new Map<string, { count: number; department: string; batch: number; }>();
            departmentFilteredData.forEach(entry => {
                const key = entry.student_name;
                studentCounts.set(key, {
                    count: (studentCounts.get(key)?.count || 0) + 1,
                    department: entry.department,
                    batch: entry.batch,
                });
            });
            finalDisplayedStudents = Array.from(studentCounts.entries()).map(([name, data]) => ({
                student_name: name,
                department: data.department,
                batch: data.batch,
                isLateOnSelectedDate: false, // Not relevant for this view
                lateArrivalTime: null, // Not relevant for this view
                lateCountAggregate: data.count,
            })).sort((a, b) => b.lateCountAggregate - a.lateCountAggregate || a.student_name.localeCompare(b.student_name));

        } else if (sortBy === 'today') {
            const uniqueStudentsMap = new Map<string, DisplayStudent>();
            dateFilteredData.forEach(student => {
                const latestTime = new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const lateCount = departmentFilteredData.filter(s => s.student_name === student.student_name).length;
                
                if (filterMode === 'monthly') {
                    // This case is handled by the 'aggregate' sort now, but good to keep logic separate for clarity
                    if (!uniqueStudentsMap.has(student.student_name)) {
                        uniqueStudentsMap.set(student.student_name, {
                            student_name: student.student_name,
                            department: student.department,
                            batch: student.batch,
                            isLateOnSelectedDate: true,
                            lateArrivalTime: null,
                            lateCountAggregate: lateCount,
                        });
                    }
                } else {
                    uniqueStudentsMap.set(student.student_name, {
                        student_name: student.student_name,
                        department: student.department,
                        batch: student.batch,
                        isLateOnSelectedDate: true,
                        lateArrivalTime: latestTime,
                        lateCountAggregate: lateCount,
                    });
                }
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

    }, [allLateArrivalsData, departmentName, filterDateInfo, selectedBatch, sortBy]);
    
    const handleSortByChange = (sortType: 'today' | 'aggregate') => {
        setSortBy(sortType);
        setShowSortOptions(false);
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
                    <button onClick={handleDownloadPDF} className="download-button">
                        <span className="icon">⬇️</span> Download as PDF
                    </button>
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
                                    {sortBy === 'today' && <th>Late Arrival Time</th>}
                                    <th>Late Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedStudents.map((student, index) => (
                                    <tr key={index}>
                                        <td data-label="Student Name">{student.student_name}</td>
                                        <td data-label="Batch">{student.batch}</td>
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