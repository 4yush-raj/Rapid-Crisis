import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateIncident from './pages/CreateIncident';
import IncidentDetail from './pages/IncidentDetail';
import GuestDetails from './pages/GuestDetails';
import Profile from './pages/Profile';
import EmergencyAlerts from './pages/EmergencyAlerts';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><NotificationProvider><Layout /></NotificationProvider></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="incidents/create" element={<CreateIncident />} />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="guests" element={<GuestDetails />} />
          <Route path="emergency-alerts" element={<EmergencyAlerts />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
