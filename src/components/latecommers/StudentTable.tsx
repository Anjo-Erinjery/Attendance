// components/StudentTable/StudentTable.tsx
import React from 'react';
import { StudentTableProps } from './types';
import './StudentTable.css';

const StudentTable: React.FC<StudentTableProps> = ({ 
  students, 
  isDateRangeMode, 
  showAggregateColumn,
  allStudents = [],
  tableRef
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const calculateAggregateCounts = (students: LateArrival[]) => {
    return students.reduce((acc, curr) => {
      acc[curr.student_name] = (acc[curr.student_name] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  };

  const aggregateCounts = calculateAggregateCounts(allStudents);

  const sortedRecentStudents = [...students].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const aggregatedData = students.reduce((acc, curr) => {
    acc[curr.student_name] = (acc[curr.student_name] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

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

export default StudentTable;