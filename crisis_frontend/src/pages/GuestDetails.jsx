import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const GuestDetails = () => {
  const { user } = useContext(AuthContext);
  const [guestDetails, setGuestDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGuestDetails = async () => {
      if (!user || user.role === 'guest') {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('users/guest_list/');
        setGuestDetails(res.data || []);
      } catch (err) {
        console.error('Failed to fetch guest details', err);
        setError('Unable to load guest details right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchGuestDetails();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Guest Details</h1>
          <p className="page-subtitle">View and manage information for all registered guests in the system.</p>
        </div>
      </div>

      {user.role === 'guest' ? (
        <div className="empty-state">
          <p className="form-note">You are not authorized to view guest details.</p>
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="loader-container"><div className="spinner"></div></div>
          ) : error ? (
            <p className="page-alert error">{error}</p>
          ) : guestDetails.length === 0 ? (
            <div className="empty-state">
              <p>No guest details found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {guestDetails.map((guest) => (
                <div key={guest.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                      {(guest.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>{guest.username || 'Unknown Guest'}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{guest.email || 'No email provided'}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Age</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{guest.age ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Gender</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{guest.gender || 'N/A'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Phone Number</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{guest.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuestDetails;
