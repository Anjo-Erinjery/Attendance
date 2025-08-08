import React, { useState } from 'react';
import '../styles/Header.css';
// import { Link } from 'react-router-dom';
const Header: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="header">
      <div className="logo">St Thomas College</div>
      <nav className="nav-links">
        <a href="#">About</a>
        <a href="#">Academics</a>
        <a href="#">Faculty</a>
        <a href="src/Contact.tsx">Contact</a>

        <div className="login-container">
          <button
            className="login-btn"
            onClick={() => setShowDropdown(prev => !prev)}
          >
            Login
          </button>
          {showDropdown && (
            <div className="login-dropdown">
              <>
                <a href="./auth/HODLogin">HOD Login</a>
                <a href="./auth/PrincipalLogin">Principal Login</a>
              </>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;