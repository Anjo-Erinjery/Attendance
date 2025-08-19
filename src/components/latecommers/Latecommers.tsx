import React, { useEffect, useState } from "react";
import LatecomersTable from "./StudentTable";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import "../latecommers/StudenTable.css";

interface LateArrival {
  student_name: string;
  timestamp: string;
}

interface ApiResponse {
  late_arrivals?: LateArrival[];
  [key: string]: any;
}

const LatecomersPage: React.FC = () => {
  const [students, setStudents] = useState<LateArrival[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<LateArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // Filter states
  const [filterMode, setFilterMode] = useState<string>('today');
  const [specificDate, setSpecificDate] = useState<string>('');

  useEffect(() => {
    const fetchLatecomers = async () => {
      if (!isAuthenticated || !token) {
        setError("Please login to access this page");
        setLoading(false);
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const endpoint = `${API_BASE_URL_DJANGO}/hod-dashboard/`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          logout();
          navigate("/login");
          throw new Error("Session expired. Please login again.");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || 
            errorData.message || 
            `Access denied. Status: ${response.status}`
          );
        }

        const data: ApiResponse = await response.json();
        
        // Handle both possible response formats
        const lateArrivals = data.late_arrivals || data;
        if (Array.isArray(lateArrivals)) {
          setStudents(lateArrivals);
          setFilteredStudents(filterLateArrivals(lateArrivals, filterMode, specificDate));
        } else {
          throw new Error("Expected array of late arrivals but got different format");
        }

      } catch (error: any) {
        console.error("Error fetching latecomers:", error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          setError("Could not connect to the server. Please check your network and try again.");
        } else {
          setError(error.message || "An unexpected error occurred while fetching data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatecomers();
  }, [token, isAuthenticated, navigate, logout]);

  // Filter function
  const filterLateArrivals = (arrivals: LateArrival[], mode: string, date: string): LateArrival[] => {
    if (mode === 'all') return arrivals;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return arrivals.filter(arrival => {
      const arrivalDate = new Date(arrival.timestamp);
      const arrivalDay = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate());
      
      if (mode === 'today') {
        return arrivalDay.getTime() === today.getTime();
      } else if (mode === 'specificDate' && date) {
        const selectedDate = new Date(date);
        const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return arrivalDay.getTime() === selectedDay.getTime();
      }
      
      return true;
    });
  };

  // Handle filter changes
  const handleFilterChange = (mode: string, date?: string) => {
    setFilterMode(mode);
    if (date) setSpecificDate(date);
    setFilteredStudents(filterLateArrivals(students, mode, date || specificDate));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Loading latecomers data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <strong className="font-bold">Error Loading Data</strong>
          </div>
          <span className="block sm:inline">{error}</span>
          <div className="mt-4 flex justify-center space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded text-sm"
            >
              Retry
            </button>
            <button 
              onClick={() => navigate("/login")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded text-sm"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="latecomers-page min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Latecomers List</h2>
          
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="filter-control">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter By:</label>
              <select 
                value={filterMode} 
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="all">All Records</option>
                <option value="specificDate">Specific Date</option>
              </select>
            </div>
            
            {filterMode === 'specificDate' && (
              <div className="filter-control">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => handleFilterChange('specificDate', e.target.value)}
                  className="w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {/* <div className="ml-auto">
              <span className="text-gray-600 font-medium">
                Showing {filteredStudents.length} of {students.length} records
              </span>
            </div> */}
          </div>
        </div>
        
        <LatecomersTable students={filteredStudents} />
      </div>
    </div>
  );
};

export default LatecomersPage;