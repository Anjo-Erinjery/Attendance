import React, { useEffect, useState } from "react";
import LatecomersTable from "./StudentTable";
import type { late_arrivals } from "./StudentTable";


const LatecomersPage: React.FC = () => {
  const [students, setStudents] = useState<late_arrivals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatecomers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetching data directly from your actual API
        const res = await fetch("http://localhost:8000/api/hod-dashboard/");
        const data: late_arrivals[] = await res.json();
        
        // Setting the state with the data from the API
        setStudents(data);

      } catch (error: any) {
        console.error("Error fetching latecomers:", error);
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatecomers();
  }, []);

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
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
