import { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, ShieldAlert, Users } from 'lucide-react';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Unable to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const endpoint = role === 'admin' ? 'users/create_admin/' : 'users/create_staff/';
      await api.post(endpoint, { username, email, password });
      
      setSuccess(`${role === 'admin' ? 'Admin' : 'Staff'} user created successfully.`);
      setUsername('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user. Ensure fields are correct and username is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', margin: '0 0 0.5rem 0' }}>User Management</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Create and manage staff and admin accounts securely.</p>
      </div>

      {error && <div className="page-alert error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="page-alert success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Create User Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <UserPlus size={24} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Register New User</h2>
          </div>

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-role">Role</label>
              <select id="new-role" value={role} onChange={e => setRole(e.target.value)} className="form-select">
                <option value="staff">Staff - Incident Management</option>
                <option value="admin">Admin - Full System Access</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-username">Username</label>
              <input id="new-username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="form-input" placeholder="e.g. jdoe_staff" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-email">Email</label>
              <input id="new-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" placeholder="e.g. staff@system.local" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-password">Password</label>
              <input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="form-input" placeholder="••••••••" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={24} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Access Directory</h2>
            </div>
            <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{users.length} Users</span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>User</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{user.username}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{user.email || 'N/A'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {user.role === 'admin' ? (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }}/> Admin</span>
                      ) : (
                        <span className="badge badge-medium">Staff</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No personnel records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminUserManagement;
