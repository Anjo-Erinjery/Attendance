import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/principaldashboard/DepartmentLatecomers.css';

// Interface for student data
interface Student {
    id: string;
    name: string;
    department: string;
    isLateToday: boolean;
    lateCountAggregate: number;
    lateArrivalTime?: string | null; // Added new field for late arrival time
}

const DepartmentLatecomers: React.FC = () => {
    const { departmentName } = useParams<{ departmentName: string }>();
    const navigate = useNavigate();
    
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // DEFAULT SORT: 'today' so Today's Latecomers are shown first
    const [sortBy, setSortBy] = useState<'today' | 'aggregate'>('today'); 
    const [showSortOptions, setShowSortOptions] = useState(false);

    const API_BASE_URL = 'http://localhost:3002';

    // Fetch All Students Data (once on mount)
    useEffect(() => {
        const fetchAllStudents = async () => {
            setIsLoading(true); setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/all-students-detailed`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: Student[] = await response.json();
                setAllStudents(data);
            } catch (err: any) {
                console.error("Failed to fetch all student data:", err);
                setError(`Failed to load student data: ${err.message}`);
            } finally { setIsLoading(false); }
        };
        fetchAllStudents();
    }, []);

    // Filter and Sort Students when dependencies change
    useEffect(() => {
        if (!departmentName || !allStudents.length) {
            setDisplayedStudents([]);
            if (!departmentName) setError("No department selected.");
            return;
        }

        // 1. Filter by department
        let studentsForDept = allStudents.filter(
            (student) => student.department === departmentName
        );

        // 2. Initial Filter: Only show students who are late at least once or late today
        let lateOnlyStudents = studentsForDept.filter(s => s.lateCountAggregate > 0 || s.isLateToday === true);

        // 3. Apply sorting based on `sortBy` state
        let sortedStudents = [...lateOnlyStudents]; 
        if (sortBy === 'today') {
            // Filter further to only today's latecomers from the 'lateOnlyStudents' set, then sort by time
            sortedStudents = sortedStudents
                .filter(s => s.isLateToday === true)
                .sort((a, b) => {
                    // Sort by late arrival time if available, otherwise by name
                    if (a.lateArrivalTime && b.lateArrivalTime) {
                        return a.lateArrivalTime.localeCompare(b.lateArrivalTime);
                    }
                    return a.name.localeCompare(b.name); 
                });
        } else if (sortBy === 'aggregate') {
            // Sort all 'lateOnlyStudents' by aggregate count, then by name
            sortedStudents.sort((a, b) => b.lateCountAggregate - a.lateCountAggregate || a.name.localeCompare(b.name));
        } else {
            // Default sort (if no sort option active, which now defaults to 'today') - just by name
            sortedStudents.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        setDisplayedStudents(sortedStudents);
    }, [allStudents, departmentName, sortBy]);

    return (
        <div className="latecomers-container">
            <header className="latecomers-header">
                <h1 className="page-title-only">{departmentName}</h1>
                <div className="sort-menu-container">
                    <button onClick={() => setShowSortOptions(!showSortOptions)} className="menu-icon-button">
                        &#9776; {/* Unicode for hamburger icon */}
                    </button>
                    {showSortOptions && (
                        <div className="sort-options-dropdown">
                            <button 
                                onClick={() => { setSortBy('today'); setShowSortOptions(false); }} 
                                className={`sort-button ${sortBy === 'today' ? 'active' : ''}`}
                            >
                                Today's Latecomers
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
                <p className="no-data-message">No latecomers found for {departmentName} at the moment.</p>
            ) : (
                <div className="students-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th> {/* New ID column */}
                                <th>Student Name</th>
                                <th>Department</th>
                                {/* Conditionally render "Late Arrival Time" or "Aggregate Late Count" header */}
                                {sortBy === 'today' && <th>Late Arrival Time</th>} {/* Displays for 'today' sort */}
                                {sortBy !== 'today' && <th>Aggregate Late Count</th>} {/* Displays for other sorts */}
                            </tr>
                        </thead>
                        <tbody>
                            {displayedStudents.map(student => (
                                <tr key={student.id}>
                                    <td data-label="ID">{student.id}</td> {/* New ID column data */}
                                    <td data-label="Student Name">{student.name}</td>
                                    <td data-label="Department">{student.department}</td>
                                    {/* Conditionally render "Late Arrival Time" or "Aggregate Late Count" cell */}
                                    {sortBy === 'today' && <td data-label="Late Arrival Time">{student.lateArrivalTime || 'N/A'}</td>} {/* Data for 'today' sort */}
                                    {sortBy !== 'today' && <td data-label="Aggregate Late Count">{student.lateCountAggregate}</td>} {/* Data for other sorts */}
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
