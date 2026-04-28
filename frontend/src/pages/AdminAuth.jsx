import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import api from '../services/api';

const AdminAuth = () => {
  const [hasAdmin, setHasAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await api.get('admin/check/');
      setHasAdmin(res.data.has_admin);
    } catch (err) {
      console.error("Failed to check admin status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!hasAdmin) {
        // Bootstrap admin
        await api.post('admin/bootstrap/', { username, email, password });
        setSuccess('Admin account created successfully. You can now sign in.');
        setHasAdmin(true);
        setUsername('');
        setPassword('');
        setEmail('');
      } else {
        // Regular staff/admin login
        const res = await login(username, password);
        // Only allow staff or admin to login via this portal
        const userRes = await api.get('users/me/');
        if (userRes.data.role === 'admin' || userRes.data.role === 'staff') {
          navigate('/admin/dashboard');
        } else {
          setError('Access denied. This portal is for administrative and staff accounts only.');
        }
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Please check the entered details.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Connection failed or unauthorized.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', width: '100%', maxWidth: '900px', boxShadow: 'var(--shadow-lg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
        
        {/* Left Side Brand Panel */}
        <div style={{ 
          background: 'radial-gradient(circle at bottom right, #111827, #374151)', 
          padding: '4rem', 
          color: 'white',
          flex: '1.2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <ShieldAlert size={48} color="#ffffff" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
              System<br/>Administration
            </h1>
            <p style={{ opacity: 0.85, fontSize: '1.05rem', lineHeight: '1.5' }}>
              Secure portal for administrative staff and management.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 10, alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.05em', backdropFilter: 'blur(5px)' }}>
            RESTRICTED ACCESS
          </div>
        </div>

        {/* Right Side Form */}
        <div className="card-surface" style={{ flex: '1', borderRadius: '0', padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {!hasAdmin ? 'System Bootstrap' : 'Admin Portal Login'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            {!hasAdmin ? 'Initialize the first administrator account.' : 'Enter your staff credentials.'}
          </p>

          {error && <div className="page-alert error" style={{ padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</div>}
          {success && <div className="page-alert success" style={{ padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="username">Username</label>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. admin" className="form-input" />
            </div>

            {!hasAdmin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. admin@example.com" className="form-input" />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="form-input" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem', background: '#1f2937', borderColor: '#111827' }} disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : (!hasAdmin ? 'Initialize Admin' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
