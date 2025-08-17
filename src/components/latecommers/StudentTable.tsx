import React from "react";
// Note: Tailwind CSS is assumed to be available globally.
// This component now uses Tailwind classes instead of a separate CSS file.

export type late_arrivals = {
  student_name: string;
  
  arrival_timestamp: string;
};

type LatecomersTableProps = {
  students: late_arrivals[];
};

const LatecomersTable: React.FC<LatecomersTableProps> = ({ students }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {students.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.student_name}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(student.arrival_timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 italic">No latecomers to display.</p>
      )}
    </div>
  );
};

export default LatecomersTable;
