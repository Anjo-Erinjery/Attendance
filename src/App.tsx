// src/App.tsx
import React from 'react';
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
};

export default App;
