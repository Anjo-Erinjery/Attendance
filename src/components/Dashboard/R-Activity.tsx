import { useEffect, useState } from "react";
import './R-Activity.css';

interface Ractivity {
  name: string;
  date: number;
  attendance: number;
  totalregistration: number;
}

const RApi = () => {
  const [activity, setActivity] = useState<Ractivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3002/activities/act");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Ractivity[] = await response.json();
        setActivity(data);
      } catch (error) {
        console.error("Error fetching activity:", error);
        setError("Failed to load activity. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="activity-section">
      <h2 className="activity-title">Recent Activity</h2>

      {loading ? (
        <p>Loading activity...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Attendance</th>
                <th>Total Registrations</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((act, index) => (
                <tr key={index}>
                  <td>{act.name}</td>
                  <td>{act.date}</td>
                  <td>{act.attendance}</td>
                  <td>{act.totalregistration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RApi;
