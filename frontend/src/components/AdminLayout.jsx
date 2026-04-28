import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/admin" />;
  }

  if (user.role !== 'admin' && user.role !== 'staff') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <AdminSidebar />
      <main style={{ flex: '1', padding: '2.5rem', overflowY: 'auto', marginLeft: '280px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
