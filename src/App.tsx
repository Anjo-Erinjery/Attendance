// src/App.tsx
import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Added .tsx extension to resolve the import errors
import PrincipalLogin from './auth/PrincipalLogin.tsx';
import HODLogin from './auth/HODLogin.tsx';
import PrincipalDashboard from './components/PrincipalDashboard.tsx'; // Import the PrincipalDashboard component

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                {/* Default route for Principal Login */}
                <Route path="/" element={<PrincipalLogin />} />
                {/* Route for HOD Login */}
                <Route path="/hod-login" element={<HODLogin />} />
                {/* New route for Principal Dashboard */}
                <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
            </Routes>
        </Router>
    );
=======
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import News from './components/News';
import Footer from './components/Footer';
import HODLogin from './auth/HODLogin';
import PrincipalLogin from './auth/PrincipalLogin';
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
        <Route path="/principal-login" element={<PrincipalLogin />} />
        
        {/* Protected dashboard route */}
        <Route path="/Dash" element={
          <ProtectedRoute allowedRoles={['HOD', 'Principal']}>
            <Dash />
          </ProtectedRoute>
            
        } />
      </Routes>
    </div>
  );
>>>>>>> origin/principal
};

export default App;
