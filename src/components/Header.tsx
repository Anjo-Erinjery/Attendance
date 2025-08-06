import React, { useState } from 'react';
// Note: We are assuming react-router-dom is available in your environment.
// If not, you can replace <Link> with <a> tags.
import { Link } from 'react-router-dom';

// The CSS file is imported here
import '../styles/Header.css';

const Header: React.FC = () => {
  // State to control the visibility of the dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);

  // A function to toggle the dropdown's visibility
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  return (
    <header className="header">
      {/* The main logo/title for the college */}
      <div className="logo">St Thomas College</div>
      <nav className="nav-links">
        {/* Main navigation links */}
        <a href="#">About</a>
        <a href="#">Academics</a>
        <a href="#">Faculty</a>
        <a href="#">Contact</a>

        {/* Container for the login button and dropdown */}
        <div className="login-container">
          <button
            className="login-btn"
            onClick={toggleDropdown}
            aria-expanded={showDropdown}
            aria-controls="login-dropdown-menu"
          >
            Login
          </button>
          {/* Conditional rendering of the dropdown */}
          {showDropdown && (
            <div className="login-dropdown" id="login-dropdown-menu">
              {/* Links inside the dropdown */}
              <Link to="/login" className="dropdown-link">HOD Login</Link>
              <Link to="/principal-login" className="dropdown-link">Principal Login</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
