import React, { useState } from 'react';
import "./NewEvent.css";

interface EventData {
  eventName: string;
  eventDescription: string;
  startDate: string;
  endDate: string;
  location: string;
  coordinator: string;
  brochure: File | null;
}

const CreateEventForm: React.FC = () => {
  const [formData, setFormData] = useState<EventData>({
    eventName: '',
    eventDescription: '',
    startDate: '',
    endDate: '',
    location: '',
    coordinator: '',
    brochure: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, brochure: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        data.append(key, value as any);
      }
    });

    try {
      const response = await fetch("http://localhost:3003/FORM", {
        method: 'POST',
        body: data
      });

      if (response.ok) {
        alert('Event created successfully!');
      } else {
        alert('Error creating event.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h2>Create New Event</h2>

      <label>Event Name</label>
      <input
        type="text"
        name="eventName"
        value={formData.eventName}
        onChange={handleChange}
        placeholder="Enter event name"
      />

      <label>Event Description</label>
      <textarea
        name="eventDescription"
        value={formData.eventDescription}
        onChange={handleChange}
        placeholder="Enter event description"
      />

      <div className="date-row">
        <div>
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <label>Event Location or Venue</label>
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleChange}
        placeholder="Enter event location or venue"
      />

      <label>Event Coordinators</label>
      <select name="coordinator" value={formData.coordinator} onChange={handleChange}>
        <option value="">Select coordinator</option>
        <option value="John">John</option>
        <option value="Alice">Alice</option>
        <option value="Bob">Bob</option>
      </select>

      <label>Upload Brochure</label>
      <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg" />

      <button type="submit">Create Event</button>
    </form>
  );
};

export default CreateEventForm;
