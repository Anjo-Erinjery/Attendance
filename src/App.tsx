import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import News from './components/News';
import Footer from './components/Footer';
// import { Routes, Route } from 'react-router-dom';
// import HODLogin from './auth/HODLogin';
// import PrincipalLogin from './auth/PrincipalLogin';
const HomePage: React.FC = () => {
  return (
    
    <div className="home-container">
      <Header />
      <Hero />
      <News />
      <Footer />
      {/* <Routes>
        <Route path="/auth/HODLogin" element={<HODLogin />} />
        <Route path="/auth/PrincipalLogin" element={<PrincipalLogin />} />
      </Routes> */}
    </div>
  );
};

export default HomePage;