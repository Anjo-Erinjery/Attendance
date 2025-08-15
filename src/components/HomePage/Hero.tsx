import React from 'react';
import '../../styles/HomePage/Hero.css';

const Hero: React.FC = () => (
  <section className="hero">
    <div className="hero-content">
      <h1>Welcome to St Thomas College</h1>
      <p>Discover academic excellence and transformative learning experiences at our prestigious institution.</p>
      <button className="explore-btn">Explore</button>
    </div>
    <div className="hero-image">
      <img src="/images/college-hero.jpg" alt="College" />
    </div>
  </section>
);

export default Hero;