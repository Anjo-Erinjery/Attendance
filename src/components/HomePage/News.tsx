import React, { useEffect } from 'react';
import { CalendarDays, Newspaper } from 'lucide-react';
import '../../styles/HomePage/News.css';

interface NewsItem {
  title: string;
  description: string;
}

interface Event {
  name: string;
  date: string;
  location: string;
}

const News: React.FC = () => {

  const [newsItems, setNewsItems] = React.useState<NewsItem[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
useEffect(() => {
  // Fetch news items
  const fetchNews = async () => {
    const response = await fetch('/api/news');
    const data = await response.json();
    setNewsItems(data);
    
  };


  // Fetch events
  const fetchEvents = async () => {
    const response = await fetch('http://localhost:3002/api/events');
    const data = await response.json();
    setEvents(data);
    console.log('Fetched events:', data);
  };

  fetchNews();
  fetchEvents();
}, []);

  return (
    <section className="news-events">
      {/* News Section */}
      <div className="news-section">
        <h2 className="section-title">
          <Newspaper size={24} /> Recent News
        </h2>
        <div className="card-container">
          {newsItems.map((item, index) => (
            <div key={index} className="news-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="events-section">
        <h2 className="section-title">
          <CalendarDays size={24} /> Upcoming Events
        </h2>
        <ul className="event-list">
          {events.map((event, index) => (
            <li key={index} className="event-item">
              <div className="event-details">
                <h4>{event.name}</h4>
                <p>{event.date} • {event.location}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default News;
