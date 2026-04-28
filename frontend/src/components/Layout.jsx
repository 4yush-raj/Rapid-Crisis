import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { NotificationBanner, NotificationStatus } from './NotificationBanner';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="user-profile">
            <span className="badge-role">
              Role: {user?.role}
            </span>
          </div>
        </header>
        <main className="page-content">
          <NotificationBanner />
          <NotificationStatus />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
