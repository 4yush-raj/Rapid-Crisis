import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import Peer from 'peerjs';

const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * targetValue));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return <span>{count}</span>;
};

const MOCK_INCIDENTS = [
  { id: 1, title: 'Fire Alarm Triggered', description: 'Fire alarm sounding in east wing kitchen.', priority: 'high', status: 'active', location: 'East Wing Kitchen', created_at: new Date().toISOString() },
  { id: 2, title: 'Medical Emergency', description: 'Guest collapsed in lobby.', priority: 'high', status: 'resolved', location: 'Main Lobby', created_at: new Date().toISOString() },
  { id: 3, title: 'Power Outage', description: 'Power lost in sector 4. Generators failing to kick in.', priority: 'medium', status: 'active', location: 'Sector 4', created_at: new Date().toISOString() },
];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const prefix = (user?.role === 'admin' || user?.role === 'staff') ? '/admin' : '';
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [profileDetails, setProfileDetails] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [sendingEmergency, setSendingEmergency] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [locationStatus, setLocationStatus] = useState('pending'); // pending, fetching, available, unavailable
  const [cameraStream, setCameraStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup camera stream and peer when component unmounts
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [cameraStream, peer]);

  useEffect(() => {
    if (!showEmergencyModal) {
      // Cleanup when modal closes
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (peer) {
        peer.destroy();
        setPeer(null);
      }
      setPeerId(null);
      setCameraEnabled(false);
    }
  }, [showEmergencyModal, cameraStream, peer]);

  useEffect(() => {
    fetchProfile();
    fetchIncidents();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('users/me/');
      setProfileDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch profile details', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await api.get('incidents/');
      setIncidents(res.data);
    } catch (err) {
      console.error('Failed to fetch incidents', err);
      // Fallback for visual demo purposes if backend isn't mounted
      setIncidents(MOCK_INCIDENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmergencyModal = () => {
    setAlertMessage('');
    setEmergencyMessage('');
    setLocationStatus('pending');
    setCameraEnabled(false);
    setShowEmergencyModal(true);
    
    // Proactively check location permission when modal opens
    if (navigator.geolocation) {
      setLocationStatus('fetching');
    } else {
      setLocationStatus('unavailable');
    }

    // Request camera access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          setCameraStream(stream);
          setCameraEnabled(true);
          // Create Peer
          const newPeer = new Peer();
          setPeer(newPeer);
          newPeer.on('open', (id) => {
            setPeerId(id);
            console.log('Peer ID:', id);
          });
          newPeer.on('call', (call) => {
            call.answer(stream);
          });
        })
        .catch((err) => {
          console.warn('Camera access denied:', err);
          setCameraEnabled(false);
        });
    } else {
      console.warn('Camera not supported');
      setCameraEnabled(false);
    }
  };

  const handleSendEmergency = async () => {
    if (!user) return;

    setSendingEmergency(true);
    setAlertMessage('');

    const guestInfo = `Guest Name: ${profileDetails?.username || user.username}\nPhone: ${profileDetails?.phone || 'N/A'}\nAge: ${profileDetails?.age || 'N/A'}\nGender: ${profileDetails?.gender || 'N/A'}\nRole: ${user.role}`;
    const details = emergencyMessage.trim() || 'Immediate emergency assistance required.';

    // Get user's current location
    let locationData = {
      latitude: null,
      longitude: null,
      location_accuracy: null,
      location_timestamp: null,
    };

    if (navigator.geolocation) {
      try {
        setLocationStatus('fetching');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { 
              timeout: 10000,  // 10 second timeout
              maximumAge: 0,   // Don't use cached location
              enableHighAccuracy: true  // Request high accuracy
            }
          );
        });

        // Extract location data from position
        locationData.latitude = position.coords.latitude;
        locationData.longitude = position.coords.longitude;
        locationData.location_accuracy = position.coords.accuracy;
        locationData.location_timestamp = new Date().toISOString();
        
        setLocationStatus('available');
        console.log('Location captured successfully:', locationData);
      } catch (locationErr) {
        console.warn('Location access error:', locationErr.message);
        setLocationStatus('unavailable');
        // Location is optional - we'll still send the alert but warn the user
        if (locationErr.code === 1) {
          setAlertMessage('Note: Location permission denied. Alert will be sent without location.');
        } else if (locationErr.code === 2) {
          setAlertMessage('Note: Location unavailable. Alert will be sent without location.');
        } else if (locationErr.code === 3) {
          setAlertMessage('Note: Location request timed out. Alert will be sent without location.');
        }
        // Continue with alert even if location fails
      }
    } else {
      console.warn('Geolocation not supported by browser');
      setLocationStatus('unavailable');
      setAlertMessage('Note: Browser does not support location tracking.');
    }

    try {
      const alertPayload = {
        message: details,
        guest_details: `${guestInfo}\nNote: ${details}`,
        ...locationData, // Include location data if available
        peer_id: peerId, // Include peer ID for camera streaming
      };

      const res = await api.post('emergency_alerts/', alertPayload);
      
      setAlertMessage('Emergency alert sent to admin and staff successfully.' + (locationData.latitude ? ' Location included.' : '') + (cameraEnabled ? ' Camera enabled.' : ''));
      setShowEmergencyModal(false);
    } catch (err) {
      console.error('Failed to send emergency alert', err);
      setAlertMessage('Unable to send emergency alert. Please try again.');
    } finally {
      setSendingEmergency(false);
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div>
      {/* Hero Welcome Block */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--color-primary), #312e81)', 
        padding: '2.5rem 3rem', 
        borderRadius: '1.5rem', 
        marginBottom: '2.5rem', 
        color: 'white', 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '1.5rem',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: 'var(--shadow-md)', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem', color: '#fff' }}>
            Welcome back, {profileDetails?.username || user?.username || 'User'}! 👋
          </h1>
          <p style={{ opacity: 0.85, fontSize: '1.05rem', margin: 0, fontWeight: 400 }}>
            Monitor active incidents, recent updates, and rapid safety alerts below.
          </p>
        </div>
        <div className="page-actions" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '1rem' }}>
          {user && (
            <button 
              type="button" 
              className="btn btn-danger" 
              style={{ boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)', padding: '0.85rem 1.5rem', fontSize: '1rem' }} 
              onClick={handleOpenEmergencyModal}
            >
              <AlertTriangle size={20} /> Emergency
            </button>
          )}
          {user && (
            <Link 
              to={`${prefix}/incidents/create`} 
              className="btn" 
              style={{ background: 'white', color: 'var(--color-primary)', padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            >
              <PlusCircle size={20} /> Report Incident
            </Link>
          )}
        </div>
        {/* Background decorative shapes */}
        <div style={{ position: 'absolute', right: '-5%', top: '-30%', width: '250px', height: '250px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
        <div style={{ position: 'absolute', right: '15%', bottom: '-40%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', filter: 'blur(10px)' }}></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              <AnimatedCounter targetValue={incidents.length} />
            </div>
            <div className="stat-label">Total Incidents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              <AnimatedCounter targetValue={incidents.filter(i => i.status === 'active').length} />
            </div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              <AnimatedCounter targetValue={incidents.filter(i => i.status === 'resolved').length} />
            </div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      {alertMessage && (
        <div className={`page-alert ${alertMessage.includes('success') ? 'success' : 'error'}`}>
          {alertMessage}
        </div>
      )}

      <div className="filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="form-select">
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="incidents-grid">
        {filteredIncidents.map(incident => (
          <div key={incident.id} className="card">
            <div className="incident-card-header">
              <h3 className="incident-card-title">{incident.title}</h3>
              <span className={`badge badge-${incident.priority}`}>{incident.priority}</span>
            </div>
            
            <div className="incident-card-meta">
              <span>{incident.location}</span>
              <span>•</span>
              <span className={`badge badge-${incident.status}`}>{incident.status}</span>
            </div>
            
            {incident.image && (
              <div className="incident-image-wrapper">
                <img
                  src={incident.image}
                  alt={incident.title}
                  className="incident-card-image"
                />
              </div>
            )}
            
            <p className="incident-card-description">
              {incident.description}
            </p>
            
            <div className="incident-card-footer">
              <span className="text-muted">
                {incident.created_at ? formatDistanceToNow(new Date(incident.created_at), { addSuffix: true }) : ''}
              </span>
              <Link to={`${prefix}/incidents/${incident.id}`} className="btn btn-secondary">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {filteredIncidents.length === 0 && (
        <div className="empty-state">
          <Search size={48} />
          <p>No incidents matched your filters.</p>
        </div>
      )}

      {showEmergencyModal && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Emergency Alert</h2>
                <p className="page-subtitle">Send an urgent guest alert to admin and staff with buzzer notification.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="info-panel">
                <h3 className="info-panel-title">Guest Details</h3>
                <div className="info-line">
                  {`Name: ${profileDetails?.username || user?.username || 'N/A'}`}
                </div>
                <div className="info-line">{`Phone: ${profileDetails?.phone || 'N/A'}`}</div>
                <div className="info-line">{`Age: ${profileDetails?.age || 'N/A'}`}</div>
                <div className="info-line">{`Gender: ${profileDetails?.gender || 'N/A'}`}</div>
              </div>

              {/* Location Status Panel */}
              <div className="info-panel" style={{ 
                background: locationStatus === 'available' ? 'rgba(16, 185, 129, 0.1)' : 
                            locationStatus === 'unavailable' ? 'rgba(239, 68, 68, 0.1)' : 
                            'rgba(107, 114, 128, 0.1)',
                borderLeft: `4px solid ${locationStatus === 'available' ? '#10b981' : 
                                        locationStatus === 'unavailable' ? '#ef4444' : 
                                        '#6b7280'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <MapPin size={18} style={{ 
                    color: locationStatus === 'available' ? '#10b981' : 
                           locationStatus === 'unavailable' ? '#ef4444' : 
                           '#6b7280'
                  }} />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Live Location</h4>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {locationStatus === 'fetching' && '📍 Requesting location access...'}
                  {locationStatus === 'available' && '✓ Location enabled - coordinates will be sent'}
                  {locationStatus === 'unavailable' && '✗ Location unavailable - will send alert without coordinates'}
                  {locationStatus === 'pending' && 'Waiting to send...'}
                </p>
              </div>

              {/* Camera Status Panel */}
              <div className="info-panel" style={{ 
                background: cameraEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderLeft: `4px solid ${cameraEnabled ? '#10b981' : '#ef4444'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: cameraEnabled ? '#10b981' : '#ef4444'
                  }} />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Live Camera</h4>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {cameraEnabled ? '✓ Camera enabled - live feed will be available to admin/staff' : '✗ Camera access denied - alert will be sent without video'}
                </p>
                {cameraEnabled && cameraStream && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <video 
                      ref={(video) => { if (video) video.srcObject = cameraStream; }}
                      autoPlay 
                      muted 
                      style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="emergency-message">Emergency details</label>
                <textarea
                  id="emergency-message"
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  placeholder="Add any extra details to help staff respond quickly..."
                  rows={4}
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEmergencyModal(false)}
                disabled={sendingEmergency}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleSendEmergency}
                disabled={sendingEmergency}
              >
                {sendingEmergency ? 'Sending...' : 'Send Emergency Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
