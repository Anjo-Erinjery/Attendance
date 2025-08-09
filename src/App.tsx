import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/HomePage/Header';
import Hero from './components/HomePage/Hero';
import News from './components/HomePage/News';
import Footer from './components/HomePage/Footer';
import Login from './auth/Login';

import Dash from './pages/Dash';
import { ProtectedRoute } from './components/common/ProtectedRoute';


const App: React.FC = () => {
  return (
    <div className="app-container">
      <Routes>
        {/* Home page route */}
        <Route path="/" element={
          <>
            <Header />
            <Hero />
            <News />
            <Footer />
          </>
        } />
        
        {/* Login routes */}
        <Route path="/Login" element={<Login />} />
        
        
        {/* Protected dashboard route */}
        <Route path="/Dash" element={
          <ProtectedRoute allowedRoles={['HOD', 'Principal']}>
            <Dash />
          </ProtectedRoute>
            
        } />
      </Routes>
    </div>
  );
};

export default App;
