import { useState } from "react";
import './sidebar.css';



import Navigation from "../Button";

const Sidebar = () => {
  
  const [open, setOpen] = useState(true);
  const {handleNavigation} =    Navigation();
  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    
    <div className={`sidebar-container ${open ? "open" : "closed"}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        {open ? "<<" : ">>"}
      </button>
     {open &&(
      <>
     <ul className="sidebar">
        <li><button onClick={() => handleNavigation("/hod")}>Dashboard</button></li>
        <li><button onClick={() => handleNavigation("/form")}>Event</button></li>
        <li><button onClick={() => handleNavigation("/late")}>Late Comers</button></li>
        <li><button onClick={() => handleNavigation("/settings")}>Settings</button></li>
      </ul>
      <button onClick={() => handleNavigation("/eventcreate")}>New Event</button>
      </>
     )}
    </div>
  );
};

export default Sidebar;
