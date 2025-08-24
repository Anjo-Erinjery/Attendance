import { useState } from "react";
import "./sidebar.css";
import Navigation from "../Button";
import {FiChevronLeft,FiMenu} from "react-icons/fi";

const Sidebar = () => {
  const [open, setOpen] = useState(false); // start closed
  const { handleNavigation } = Navigation();

  return (
    <div
      className={`sidebar-container ${open ? "open" : "closed"}`}
      onMouseEnter={() => setOpen(true)}   // hover open
      onMouseLeave={() => setOpen(false)} // hover close
    >
      <button className="toggle-button">
        {open ? <FiChevronLeft size={20} /> : <FiMenu size={20} />}
      </button>

      <ul className="sidebar">
        <li><button onClick={() => handleNavigation("/Dash")}>Dashboard</button></li>
        <li><button onClick={() => handleNavigation("/form")}>Event</button></li>
        <li><button onClick={() => handleNavigation("/latecomme")}>Late Comers</button></li>
        <li><button onClick={() => handleNavigation("/settings")}>Settings</button></li>
      </ul>

      <button className="new-event-btn" onClick={() => handleNavigation("/NewEvent")}>
        New Event
      </button>
    </div>
  );
};

export default Sidebar;
