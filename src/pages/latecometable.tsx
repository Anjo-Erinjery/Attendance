import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Dashboard/sidebar";
import Header from "../components/HomePage/Header";
import Footer from "../components/HomePage/Footer";
import LatecomersPage from "../components/latecommers/Latecommers"; // Adjust path to where you saved it

const Latemain: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 4, display: "flex", flexDirection: "column" }}>
        <Header />

        <main style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<LatecomersPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Latemain;
