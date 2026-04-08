import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './auth/LandingPage';
import Layout from './main/Layout';
import Dashboard from './main/Dashboard';
import Materials from './main/Materials';
import AddMaterial from './main/AddMaterial';
import Settings from './main/Settings';
import { ToastContainer } from './components/Toast';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/add-material" element={<AddMaterial />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
