import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import News from './components/News';
import Footer from './components/Footer';
import HODLogin from './auth/HODLogin';

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
        <Route path="/login" element={<HODLogin />} />
        
        
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
