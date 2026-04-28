import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await api.post('users/', { username, email, password, role });
        setSuccess('Account created successfully. You can now sign in.');
        setIsSignUp(false);
        setUsername('');
        setPassword('');
        setEmail('');
        setRole('staff');
      } else {
        await login(username, password);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Please check the entered details.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Connection failed. Ensure Django backend is running on port 8000.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', width: '100%', maxWidth: '900px', boxShadow: 'var(--shadow-lg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
        
        {/* Left Side Brand Panel */}
        <div style={{ 
          background: 'radial-gradient(circle at bottom right, #312e81, var(--color-primary))', 
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
              Rapid<br/>Crisis<br/>Response
            </h1>
            <p style={{ opacity: 0.85, fontSize: '1.05rem', lineHeight: '1.5' }}>
              A premium dashboard for incident tracking, guest alerts, and real-time emergency mitigation.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 10, alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.05em', backdropFilter: 'blur(5px)' }}>
            SECURE SYSTEM PORTAL
          </div>
          {/* Abstract decor */}
          <div style={{ position: 'absolute', top: '-10%', right: '-15%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(20px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(15px)' }}></div>
        </div>

        {/* Right Side Form */}
        <div className="card-surface" style={{ flex: '1', borderRadius: '0', padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            {isSignUp ? 'Register to manage crisis systems.' : 'Enter your credentials to continue.'}
          </p>

          {error && <div className="page-alert error" style={{ padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</div>}
          {success && <div className="page-alert success" style={{ padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="username">Username</label>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. admin" className="form-input" />
            </div>

            {isSignUp && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. user@example.com" className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="role">Role</label>
                  <select id="role" value={role} onChange={e => setRole(e.target.value)} required className="form-select">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
                {!isSignUp && <a href="#" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none' }}>Forgot?</a>}
              </div>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="form-input" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }} disabled={isSubmitting}>
              {isSubmitting ? (isSignUp ? 'Creating...' : 'Authenticating...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              className="btn btn-link"
              style={{ color: 'var(--color-primary)', marginLeft: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }}
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
