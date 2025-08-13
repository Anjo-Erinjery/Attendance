import { useEffect, useState } from "react";
import './U-Event.css';

interface Event {
  id: number;
  name: string;
  date: number;
  image: string;
}

const Api = () => {
  const [event, setUevent] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3003/events/Uevents");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Event[] = await response.json();
        setUevent(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="all">
      <h1>Dashboard</h1>
      <h2>Upcoming Events</h2>

      {loading ? (
        <p>Loading events...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : event.length > 0 ? (
        <div className="list">
          {event.map((events) => (
            <div className="cards" key={events.id}>
              <img src={events.image} alt={events.name} />
              <h3>{events.name}</h3>
              <p>{events.date}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No events found.</p>
      )}
    </div>
  );
};

export default Api;
