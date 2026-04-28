import { NavLink } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, LayoutDashboard, PlusCircle, LogOut, Users, User, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const [activeTasks, setActiveTasks] = useState(0);
  const [resolvedTasks, setResolvedTasks] = useState(0);

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user || user.role === 'guest') return;

      try {
        const statsRes = await api.get('incidents/stats/');
        setActiveTasks(statsRes.data.active_tasks || 0);
        setResolvedTasks(statsRes.data.resolved_tasks || 0);
      } catch (error) {
        console.error('Failed to load incident stats', error);
      }
    };

    fetchSidebarData();
  }, [user]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <ShieldAlert size={24} color="#3b82f6" />
        <span>CrisisFlow</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        {user?.role !== 'guest' && (
          <NavLink to="/incidents/create" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <PlusCircle size={20} />
            <span>Report Incident</span>
          </NavLink>
        )}

        {user?.role !== 'guest' && (
          <NavLink to="/guests" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} />
            <span>Guest Details</span>
          </NavLink>
        )}

        {user?.role !== 'guest' && (
          <NavLink to="/emergency-alerts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <AlertTriangle size={20} />
            <span>Emergency Alerts</span>
          </NavLink>
        )}

        <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <User size={20} />
          <span>My Profile</span>
        </NavLink>
      </nav>
      
      {user?.role !== 'guest' && (
        <div className="sidebar-summary">
          <div className="sidebar-summary-title">Task Summary</div>
          <div className="sidebar-summary-row">
            <span>Active</span>
            <strong>{activeTasks}</strong>
          </div>
          <div className="sidebar-summary-row">
            <span>Resolved</span>
            <strong>{resolvedTasks}</strong>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
