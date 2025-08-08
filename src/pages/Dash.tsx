import React from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard'; // Assuming this is the HOD Dashboard
import Footer from '../components/Footer';
import PrincipalDashboard from '../components/PrincipalDashboard'; // Import PrincipalDashboard directly
import { useAuthStore } from '../store/authStore'; // Import useAuthStore to get user role

const Dash: React.FC = () => {
  // Get the user object from the authentication store
  const { user } = useAuthStore();
    console.log("Dash.tsx: Current user object from authStore:", user);
  console.log("Dash.tsx: Current user role:", user?.role);

  // Determine which dashboard to render based on the user's role
  const renderDashboard = () => {
    if (user?.role === 'HOD') {
      return <Dashboard />; // Render the HOD Dashboard
    } else if (user?.role === 'Principal') {
      return <PrincipalDashboard />; // Render the Principal Dashboard
    }
    // Optionally, return a default component or null if the role is not recognized
    return null;
  };

  return (
    <>
      <Header />
      {renderDashboard()} {/* Call the function to conditionally render the dashboard */}
      <Footer />
    </>
  );
};

export default Dash;
