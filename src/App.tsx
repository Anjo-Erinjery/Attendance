import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrincipalLogin from './auth/PrincipalLogin';
import PrincipalDashboard from './components/PrincipalDashboard'; // Import the PrincipalDashboard component

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Routes>
        {/* Default route leads to Principal Login */}
        <Route path="/" element={<PrincipalLogin />} />
        {/* Or you could keep /principal-login if you prefer a dedicated login path */}
        {/* <Route path="/principal-login" element={<PrincipalLogin />} /> */}
        
        {/* Route for the Principal Dashboard */}
        {/* This route assumes successful login will navigate here. */}
        {/* Authentication and redirection from PrincipalLogin to /principal-dashboard
            should be handled within PrincipalLogin component or an auth context. */}
        <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
      </Routes>
    </div>
  );
};

export default App;
