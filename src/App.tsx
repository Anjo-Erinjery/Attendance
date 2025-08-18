import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/HomePage/Header';
import Hero from './components/HomePage/Hero';
import News from './components/HomePage/News';
import Footer from './components/HomePage/Footer';
import Login from './auth/Login';

import Dash from './pages/Dash';

import { ProtectedRoute } from './components/common/ProtectedRoute';

// ONLY ADDED THIS IMPORT for DepartmentLatecomers
import DepartmentLatecomers from './components/principledashboard/DepartmentLatecomers'; // The path you specified

// import Api from './components/Dashboard/U-Events';
// import RApi from './components/Dashboard/R-Activity';
// import { Sidebar } from 'lucide-react';
import HODDashboard from './pages/HODDashboard';
import Latemain from './pages/latecometable';


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
        
        {/* Login route */}
        <Route path="/Login" element={<Login />} />
        
        {/* Protected dashboard route (handling HOD and Principal roles) */}
        <Route path="/Dash" element={
          <ProtectedRoute allowedRoles={['HOD', 'Principal']}>

            <Dash />


          <><HODDashboard/>
          </>

          </ProtectedRoute>
          
        } />
      {/* ----------------------------------------------------------- */}

        {/* --- ADDED NEW ROUTE FOR DEPARTMENT LATECOMERS --- */}
        {/* This route will render DepartmentLatecomers when the URL matches /department-dashboard/ANY_DEPARTMENT_NAME */}
        <Route path="/department-dashboard/:departmentName" element={

          <ProtectedRoute allowedRoles={['Principal']}> {/* Assuming only Principals should view this */}
            <DepartmentLatecomers />
          </ProtectedRoute>
        } />

{/* ----------------------------------------------------------- */}
  

        {/* ----------------------------------------------------------- */}
            <Route path="/latecomme/*" element={<Latemain />} />

      </Routes>
    </div>
  );
};

export default App;