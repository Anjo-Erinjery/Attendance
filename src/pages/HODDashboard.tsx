import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Dashboard/sidebar";
import Api from "../components/Dashboard/U-Events";
import RApi from "../components/Dashboard/R-Activity";

import Form from "../NewEvent"; // Adjust path to where you saved it


// import Form from "../NewEvent";
import Header from "../components/HomePage/Header";
import Footer from "../components/HomePage/Footer";
import LatecomersPage from "../components/latecommers/Latecommers";
// import { MoveLeft } from "lucide-react";

const HODDashboard: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar always visible */}
      <Sidebar />
     
      


      {/* Main Content Area */}
      <div style={{ flex: 4, display: "flex", flexDirection: "column",}}>
        {/* Top header */}
        {/* <Header /> */}

        {/* Page content */}
        <main style={{ flex: 1, padding: "20px" }}>
          <Routes>
            {/* Dashboard main page */}
            <Route
              path="/"
              element={
                <>
                
                  <Api />
                  <RApi />
                </>
              }
            />

            {/* Create event page */}
          
          </Routes>
        </main>

        {/* Footer */}
        
      </div>
    </div>
  );
};

export default HODDashboard;
