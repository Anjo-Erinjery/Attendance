import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/Dashboard/sidebar';
import Api from '../components/Dashboard/U-Events';
import RApi from '../components/Dashboard/R-Activity';
import Form from '../NewEvent'; // or './components/form' if it's inside components

const HODDashboard: React.FC = () =>{
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar /> {/* Sidebar always visible */}

            <div style={{ flex: 1, padding: '20px' }}>
                <Routes>
                    {/* Home/Dashboard */}
                    <Route path="/hod" element={
                        <>
                        <Api />
                        <RApi />
                        </>
                      } />
                    <Route path='/eventcreate' element={<Form />} /></Routes>
                    
            </div>
        </div>
    );
}

export default HODDashboard;
