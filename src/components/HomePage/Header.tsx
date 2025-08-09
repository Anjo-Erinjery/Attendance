import React from 'react';

// The CSS file is imported here
import '../../styles/Header.css';

const Header: React.FC = () => {

  return (
    <header className="header">
      {/* The main logo/title for the college */}
      <div className="logo" >St Thomas College</div>
      <nav className="nav-links">
        {/* Main navigation links */}
        <a href="#">About</a>
        <a href="#">Academics</a>
        <a href="#">Faculty</a>
        <a href="#">Contact</a>
        <a href="/login">Login</a>

               
      </nav>
    </header>
  );
};

export default Header;
