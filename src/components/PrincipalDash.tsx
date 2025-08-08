import React from 'react';
import { useAuthStore } from '../store/authStore'; // Assuming authStore is in this path

const PrincipalDashboard: React.FC = () => {
  const { user } = useAuthStore(); // Get user information from the auth store

  // Define statistics relevant to a Principal
  const stats = [
    { name: 'Total Departments', value: '15', change: '+1 new department' },
    { name: 'Overall Attendance', value: '92%', change: '+1% last month' },
    { name: 'Faculty Count', value: '150', change: '+5 new hires' },
    { name: 'Budget Utilization', value: '75%', change: 'On track' },
  ];

  return (
    <div className="space-y-6 p-6"> {/* Added padding for better layout */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, Principal {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of the institution's key metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Institution Highlights</h2>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="text-sm font-medium text-gray-900">New Research Grant Awarded</p>
              <p className="text-sm text-gray-600">Funding secured for AI project.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="text-sm font-medium text-gray-900">Student Enrollment Up</p>
              <p className="text-sm text-gray-600">5% increase in new admissions.</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <p className="text-sm font-medium text-gray-900">Campus Infrastructure Project</p>
              <p className="text-sm text-gray-600">Phase 1 completed ahead of schedule.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Student Satisfaction</span>
              <span className="text-sm text-blue-600">4.5/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Faculty Retention Rate</span>
              <span className="text-sm text-green-600">90%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Graduation Rate</span>
              <span className="text-sm text-purple-600">88%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
