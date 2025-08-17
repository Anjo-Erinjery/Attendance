import React from "react";
import "./StudenTable.css";

export type late_arrivals = {
  student_name: string;
  dept_name: string;
  arrival_timestamp: string;
};

type LatecomersTableProps = {
  students: late_arrivals[];
};

const LatecomersTable: React.FC<LatecomersTableProps> = ({ students }) => {
  return (
    <div className="main-content">
    <table className="latecomers-table">
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Status</th>
          <th>Arrival Time</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, index) => (
          <tr key={index}>
            <td>{student.student_name}</td>
            <td className={student.dept_name}>
              {student.dept_name}
            </td>
            <td>{student.arrival_timestamp}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
};

export default LatecomersTable;
