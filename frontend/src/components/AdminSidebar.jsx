import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, LayoutDashboard, Database, PowerOff, Shield, PlusCircle, Users, AlertTriangle, User } from 'lucide-react';

const AdminSidebar = () => {
  const { logout, user } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    window.location.href = '/admin';
  };

  return (
    <aside className="sidebar" style={{ background: '#111827', color: '#fff', borderRight: 'none' }}>
      <div className="sidebar-header" style={{ borderBottomColor: '#374151', color: '#fff' }}>
        <ShieldAlert size={24} color="#60a5fa" />
        <span style={{ color: '#fff' }}>Admin Portal</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink 
          to="/admin/dashboard" 
          className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
          style={({isActive}) => isActive ? { background: '#1f2937', color: '#60a5fa' } : { color: '#d1d5db' }}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>

        <NavLink 
          to="/admin/incidents/create" 
          className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
          style={({isActive}) => isActive ? { background: '#1f2937', color: '#60a5fa' } : { color: '#d1d5db' }}
        >
          <PlusCircle size={20} />
          <span>Report Incident</span>
        </NavLink>

        <NavLink 
          to="/admin/guests" 
          className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
          style={({isActive}) => isActive ? { background: '#1f2937', color: '#60a5fa' } : { color: '#d1d5db' }}
        >
          <Users size={20} />
          <span>Guest Details</span>
        </NavLink>

        <NavLink 
          to="/admin/emergency-alerts" 
          className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
          style={({isActive}) => isActive ? { background: '#1f2937', color: '#60a5fa' } : { color: '#d1d5db' }}
        >
          <AlertTriangle size={20} />
          <span>Emergency Alerts</span>
        </NavLink>
        
        {user?.role === 'admin' && (
          <NavLink 
            to="/admin/users" 
            className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
            style={({isActive}) => isActive ? { background: '#1f2937', color: '#60a5fa' } : { color: '#d1d5db' }}
          >
            <Shield size={20} />
            <span>User Management</span>
          </NavLink>
        )}

        <NavLink 
          to="/admin/profile" 
          className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
          style={({isActive}) => isActive ? { background: '#1f2937', color: '#60a5fa' } : { color: '#d1d5db' }}
        >
          <User size={20} />
          <span>My Profile</span>
        </NavLink>

      </nav>
      
      <div className="sidebar-footer" style={{ borderTopColor: '#374151' }}>
        <button className="nav-item" onClick={handleLogout} style={{ color: '#d1d5db' }}>
          <PowerOff size={20} />
          <span>Exit Portal</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
