// import React from "react";
// import "./HODDashboard.css"; // The new consolidated CSS file

// interface DjangoLateArrival {
//   student_name: string;
//   timestamp: string;
//   department: string;
//   batch:number;
// }

// type StudentTableProps = {
//   students: DjangoLateArrival[];
// };

// const StudentTable: React.FC<StudentTableProps> = ({ students }) => {
//   const formatTime = (timestamp: string) => {
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const formatDate = (timestamp: string) => {
//     const date = new Date(timestamp);
//     return date.toLocaleDateString();
//   };

//   return (
//     <div className="students-table-container">
//       {students.length > 0 ? (
//         <div className="overflow-x-auto">
//           <table>
//             <thead>
//               <tr>
//                 <th>Student Name</th>
//                 <th>Date</th>
//                 <th>Arrival Time</th>
//               </tr>
//             </thead>
//             <tbody>
//               {students.map((student, index) => (
//                 <tr key={index}>
//                   <td data-label="Student Name">{student.student_name}</td>
//                   <td data-label="Date">{formatDate(student.timestamp)}</td>
//                   <td data-label="Arrival Time">{formatTime(student.timestamp)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <p className="no-data-message">No latecomers found for the selected filter.</p>
//       )}
//     </div>
//   );
// };

// export default StudentTable;

