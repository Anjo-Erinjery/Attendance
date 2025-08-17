import React, { useEffect, useState } from "react";
import LatecomersTable from "./StudentTable";
import type { late_arrivals } from "./StudentTable";



const LatecomersPage: React.FC = () => {
  const [students, setStudents] = useState<late_arrivals[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatecomers = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/hod-dashboard/");
        console.log("API Response:", students);
        const data: late_arrivals[] = await res.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching latecomers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatecomers();
  }, []);

  if (loading) return <p>Loading latecomers...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Latecomers List</h2>
      <LatecomersTable students={students} />
    </div>
  );
};

export default LatecomersPage;
