import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/principaldashboard/DepartmentLatecomers.css';
import { useAuthStore } from '../../store/authStore';

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
    const { token } = useAuthStore();
    
    // Store all fetched data from the single API endpoint
    const [allFetchedData, setAllFetchedData] = useState<LateArrival[]>([]);
    const [displayedStudents, setDisplayedStudents] = useState<DisplayStudent[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sortBy, setSortBy] = useState<'today' | 'aggregate'>('today'); 
    const [showSortOptions, setShowSortOptions] = useState(false);

    // Get the date passed from the Principal Dashboard
    const { filterDate } = (location.state as { filterDate?: string; }) || {};
    const dateToDisplay = filterDate || new Date().toISOString().split('T')[0];

    // Use environment variable for Django API base URL
    const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    // Fetch ALL student data from the principal's dashboard endpoint once
    useEffect(() => {
        const fetchAllLatecomers = async () => {
            if (!token) {
                setError("Authentication token is missing.");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            setError(null);
            try {
                // Fetch from the principal dashboard endpoint
                const endpoint = `${API_BASE_URL_DJANGO}/principal-dashboard/`;
                
                const response = await fetch(endpoint, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.detail) errorMessage = errorData.detail;
                    } catch (jsonError) {
                        console.error("Failed to parse error response:", jsonError);
                    }
                    throw new Error(errorMessage);
                }
                
                const data = await response.json();
                setAllFetchedData(data.late_arrivals); // Assuming the response format is { "late_arrivals": [...] }
            } catch (err: any) {
                console.error("Failed to fetch all latecomers data:", err);
                setError(`Failed to load student data: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllLatecomers();
    }, [token]);

    // Filter and Sort students based on user selections and the fetched data
    useEffect(() => {
        const urlDeptName = decodeURIComponent(departmentName).toLowerCase().trim();
        const urlDeptNameFormatted = urlDeptName.replace(/-/g, ' '); 

        if (!urlDeptNameFormatted || !allFetchedData.length) {
            setDisplayedStudents([]);
            return;
        }

        const uniqueStudentsInDept = new Map<string, DisplayStudent>();
        
        const lateCountMap = new Map<string, number>();
        allFetchedData.forEach(student => {
            if (student.department.toLowerCase().trim() === urlDeptNameFormatted) {
                lateCountMap.set(student.student_name, (lateCountMap.get(student.student_name) || 0) + 1);
            }
        });

        const matchingData = allFetchedData.filter(student => student.department.toLowerCase().trim() === urlDeptNameFormatted);

        matchingData.forEach(student => {
            const isLateOnSelectedDate = student.timestamp.startsWith(dateToDisplay);
            
            if (!uniqueStudentsInDept.has(student.student_name)) {
                const lateArrivalTime = isLateOnSelectedDate 
                    ? new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : null;
                
                uniqueStudentsInDept.set(student.student_name, {
                    student_name: student.student_name,
                    department: student.department,
                    batch: student.batch,
                    isLateOnSelectedDate: isLateOnSelectedDate,
                    lateArrivalTime: lateArrivalTime,
                    lateCountAggregate: lateCountMap.get(student.student_name) || 0,
                });
            } else {
                const existingEntry = uniqueStudentsInDept.get(student.student_name)!;
                if (isLateOnSelectedDate && existingEntry.isLateOnSelectedDate) {
                    const newTime = new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (newTime > (existingEntry.lateArrivalTime || '')) {
                        existingEntry.lateArrivalTime = newTime;
                    }
                }
                if (isLateOnSelectedDate && !existingEntry.isLateOnSelectedDate) {
                     const newTime = new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                     existingEntry.isLateOnSelectedDate = true;
                     existingEntry.lateArrivalTime = newTime;
                }
            }
        });

        let sortedStudents = Array.from(uniqueStudentsInDept.values());

        if (sortBy === 'today') {
            sortedStudents = sortedStudents
                .filter(s => s.isLateOnSelectedDate)
                .sort((a, b) => a.lateArrivalTime!.localeCompare(b.lateArrivalTime!));
        } else if (sortBy === 'aggregate') {
            sortedStudents.sort((a, b) => b.lateCountAggregate - a.lateCountAggregate || a.student_name.localeCompare(b.student_name));
        }
        
        setDisplayedStudents(sortedStudents);
    }, [allFetchedData, departmentName, sortBy, dateToDisplay]);

    const formatDepartmentName = (name: string) => {
        return decodeURIComponent(name || '').replace(/-/g, ' ');
    }

    return (
        <div className="latecomers-container">
            <header className="latecomers-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    &larr; Back
                </button>
                {/* REMOVED "LATECOMERS" FROM THE TITLE */}
                <h1 className="page-title">
                    {formatDepartmentName(departmentName)}
                </h1>
                <div className="sort-menu-container">
                    <button onClick={() => setShowSortOptions(!showSortOptions)} className="menu-icon-button">
                        &#9776;
                    </button>
                    {showSortOptions && (
                        <div className="sort-options-dropdown">
                            <button 
                                onClick={() => { setSortBy('today'); setShowSortOptions(false); }} 
                                className={`sort-button ${sortBy === 'today' ? 'active' : ''}`}
                            >
                                Latecomers ({dateToDisplay})
                            </button>
                            <button 
                                onClick={() => { setSortBy('aggregate'); setShowSortOptions(false); }} 
                                className={`sort-button ${sortBy === 'aggregate' ? 'active' : ''}`}
                            >
                                Highest Late Count
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {error && (<div className="error-message"><p>{error}</p></div>)}

            {isLoading ? (
                <p className="loading-message">Loading students data...</p>
            ) : displayedStudents.length === 0 && !error ? (
                <p className="no-data-message">No latecomers found for {formatDepartmentName(departmentName)} on {dateToDisplay}.</p>
            ) : (
                <div className="students-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Department</th>
                                {sortBy === 'today' && <th>Late Arrival Time</th>}
                                {sortBy !== 'today' && <th>Aggregate Late Count</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {displayedStudents.map((student, index) => (
                                <tr key={index}>
                                    <td data-label="Student Name">{student.student_name}</td>
                                    <td data-label="Department">{student.department}</td>
                                    {sortBy === 'today' && <td data-label="Late Arrival Time">{student.lateArrivalTime || 'N/A'}</td>}
                                    {sortBy !== 'today' && <td data-label="Aggregate Late Count">{student.lateCountAggregate}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DepartmentLatecomers;