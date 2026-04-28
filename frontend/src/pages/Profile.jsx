import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Phone, Calendar, UserCircle } from 'lucide-react';
import api from '../services/api';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('users/me/');
        setFormData({
          age: res.data.age || '',
          gender: res.data.gender || '',
          phone: res.data.phone || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setMessage('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.name === 'age' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      age: formData.age === '' ? null : Number(formData.age),
      gender: formData.gender || null,
      phone: formData.phone || null,
    };

    try {
      await api.patch('users/me/', payload);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      const serverMessage = error?.response?.data?.detail || 'Failed to update profile. Please try again.';
      setMessage(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and system preferences.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2.5fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Sidebar Profile Badge */}
        <div className="card-surface" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }}>
            <UserCircle size={48} />
          </div>
          <h3 className="detail-title" style={{ margin: 0, fontSize: '1.25rem' }}>{user.username || 'System User'}</h3>
          <span className="badge badge-role" style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>{user.role}</span>
        </div>

        {/* Right Form Card */}
        <div className="card-surface">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            <User size={20} className="icon-inline" style={{ color: 'var(--color-primary)' }} /> Personal Information
          </h2>

          {message && (
            <div className={`page-alert ${message.includes('success') ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="age" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={16} /> Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  max="120"
                  placeholder="e.g. 30"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="gender" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <User size={16} /> Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label htmlFor="phone" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Phone size={16} /> Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+1-555-123-4567"
                />
              </div>

            </div>
            
            <div className="form-actions" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.85rem 2.5rem' }}>
                {saving ? 'Saving Changes...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;