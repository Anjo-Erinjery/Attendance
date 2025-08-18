import React, { useEffect, useState } from "react";
import LatecomersTable from "./StudentTable";
import type { late_arrivals } from "./StudentTable";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const LatecomersPage: React.FC = () => {
  const [students, setStudents] = useState<late_arrivals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatecomers = async () => {
      // Check authentication first
      if (!isAuthenticated || !token) {
        setError("Please login to access this page");
        setLoading(false);
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const endpoint = `${API_BASE_URL_DJANGO}/hod-dashboard/`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          // Token might be expired or invalid
          logout();
          navigate("/login");
          throw new Error("Session expired. Please login again.");
        }

        if (!response.ok) {
          throw new Error(`Access denied. You might not have HOD privileges.`);
        }

        const data = await response.json();
        setStudents(data);

      } catch (error: any) {
        console.error("Error fetching latecomers:", error);
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatecomers();
  }, [token, isAuthenticated, navigate, logout]);

  // ... rest of your component remains the same
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
        <p className="text-xl text-gray-700 font-semibold">Loading latecomers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          {error.includes("login") && (
            <button 
              onClick={() => navigate("/login")}
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Latecomers List</h2>
      </div>
      <LatecomersTable students={students} />
    </div>
  );
};

export default LatecomersPage;