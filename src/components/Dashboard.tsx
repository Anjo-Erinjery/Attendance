import React from 'react';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const stats = [
    { name: 'Total Events', value: '12', change: '+2 this week' },
    { name: 'Attendance Rate', value: '94%', change: '+3% this week' },
    { name: 'Latecomers Today', value: '8', change: '-2 from yesterday' },
    { name: 'Upcoming Events', value: '3', change: 'Next in 2 days' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your events today.
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Latecomers</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">John Doe - CS Dept</span>
              <span className="text-sm text-red-600">15 min late</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Jane Smith - IT Dept</span>
              <span className="text-sm text-red-600">8 min late</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mike Johnson - CS Dept</span>
              <span className="text-sm text-red-600">12 min late</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="text-sm font-medium text-gray-900">Tech Symposium</p>
              <p className="text-sm text-gray-600">Tomorrow, 2:00 PM</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="text-sm font-medium text-gray-900">Guest Lecture</p>
              <p className="text-sm text-gray-600">Friday, 10:00 AM</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <p className="text-sm font-medium text-gray-900">Workshop</p>
              <p className="text-sm text-gray-600">Next Monday, 9:00 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
