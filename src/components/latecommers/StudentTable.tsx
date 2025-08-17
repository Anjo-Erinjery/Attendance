import React from "react";
import "./StudenTable.css";

export type Student = {
  studentName: string;
  statusLate: boolean;
  arrivalTime: string;
};

type LatecomersTableProps = {
  students: Student[];
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
            <td>{student.studentName}</td>
            <td className={student.statusLate ? "status-late" : "status-ontime"}>
              {student.statusLate ? "Late" : "On Time"}
            </td>
            <td>{student.arrivalTime}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
};

export default LatecomersTable;
