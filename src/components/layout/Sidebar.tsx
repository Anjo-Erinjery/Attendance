import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const navigation = user?.role === 'HOD' 
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Events', href: '/events', icon: '📅' },
        { name: 'Late Records', href: '/late-records', icon: '⏰' },
        { name: 'Reports', href: '/reports', icon: '📈' },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Late Records', href: '/late-records', icon: '⏰' },
        { name: 'Reports', href: '/reports', icon: '📈' },
      ];

  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="text-white flex items-center space-x-2 px-4">
        <span className="text-2xl font-extrabold">EventTracker</span>
      </div>

      <nav>
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white ${
              location.pathname === item.href ? 'bg-gray-900 text-white' : ''
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
