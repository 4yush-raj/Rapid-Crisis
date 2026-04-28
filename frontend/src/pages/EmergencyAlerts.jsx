import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, MapPin, Navigation } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import Peer from 'peerjs';

const EmergencyAlerts = () => {
  const { user } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(null);
  const [cameraStreams, setCameraStreams] = useState({}); // alert.id -> stream

  useEffect(() => {
    if (user && user.role !== 'guest') {
      fetchAlerts();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      // Cleanup camera streams
      Object.values(cameraStreams).forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, [cameraStreams]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('emergency_alerts/');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch emergency alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    setMarkingRead(alertId);
    try {
      await api.post(`emergency_alerts/${alertId}/mark_read/`);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to mark alert as read', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const connectToCamera = (alert) => {
    if (!alert.peer_id) return;

    const peer = new Peer();
    peer.on('open', () => {
      const call = peer.call(alert.peer_id, null); // No local stream since we're receiving
      call.on('stream', (remoteStream) => {
        setCameraStreams(prev => ({ ...prev, [alert.id]: remoteStream }));
      });
      call.on('error', (err) => {
        console.error('Call error:', err);
      });
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(225, 29, 72, 0.15)', color: 'var(--color-danger)', padding: '0.65rem', borderRadius: '1rem', display: 'flex' }}>
              <ShieldAlert size={28} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Emergency Alerts</h1>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '4rem', marginTop: 0 }}>Manage urgent guest alerts requiring immediate attention.</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-main)', borderRadius: '1.5rem', padding: '4rem 2rem', border: '1px dashed var(--border-color)' }}>
          <div style={{ background: 'var(--color-success)', color: 'white', padding: '1rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '1.5rem', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)' }}>
            <CheckCircle size={40} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>All Clear</h3>
          <p style={{ fontSize: '1.05rem', marginTop: '0.5rem' }}>All emergency alerts have been addressed and resolved.</p>
        </div>
      ) : (
        <div className="alerts-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="card alert-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 1fr', gap: '2rem', alignItems: 'center', border: '1px solid rgba(225, 29, 72, 0.3)', background: 'linear-gradient(to right, rgba(225, 29, 72, 0.03), transparent)' }}>
              
              <div className="alert-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="badge" style={{ background: 'var(--color-danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}>
                    <AlertTriangle size={14} /> EMERGENCY
                  </div>
                  <div className="alert-time" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} />
                    <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="alert-message" style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Emergency Details</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.message}</p>
                </div>

                <div className="alert-guest-details" style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guest Information</h4>
                  <div className="guest-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {alert.guest_details.split('\n').map((line, index) => (
                      <div key={index} className="info-line" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Information Section */}
                {(alert.latitude || alert.longitude) ? (
                  <div className="alert-location" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: '#10b981' }} />
                      Live Location
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Latitude</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{alert.latitude?.toFixed(6)}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Longitude</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{alert.longitude?.toFixed(6)}</p>
                      </div>
                      {alert.location_accuracy && (
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Accuracy</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{alert.location_accuracy.toFixed(2)}m</p>
                        </div>
                      )}
                      {alert.location_timestamp && (
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Captured</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{new Date(alert.location_timestamp).toLocaleTimeString()}</p>
                        </div>
                      )}
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#10b981', color: 'white', borderRadius: '0.5rem', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <Navigation size={14} /> Open in Google Maps
                    </a>
                  </div>
                ) : (
                  <div className="alert-location" style={{ background: 'rgba(107, 114, 128, 0.1)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(107, 114, 128, 0.3)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} /> No location data available
                    </p>
                  </div>
                )}

                {/* Camera Section */}
                {alert.peer_id ? (
                  <div className="alert-camera" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6' }} />
                      Live Camera Feed
                    </h4>
                    {cameraStreams[alert.id] ? (
                      <video 
                        ref={(video) => { if (video) video.srcObject = cameraStreams[alert.id]; }}
                        autoPlay 
                        style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera feed available - click to connect</p>
                        <button
                          className="btn"
                          style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => connectToCamera(alert)}
                        >
                          Connect to Camera
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert-camera" style={{ background: 'rgba(107, 114, 128, 0.1)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(107, 114, 128, 0.3)', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#6b7280' }} />
                      No camera feed available
                    </p>
                  </div>
                )}
              </div>

              <div className="alert-actions" style={{ display: 'flex', justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
                <button
                  className="btn"
                  style={{ background: 'var(--color-success)', color: 'white', padding: '1rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                  onClick={() => markAsRead(alert.id)}
                  disabled={markingRead === alert.id}
                >
                  {markingRead === alert.id ? (
                    <>Marking...</>
                  ) : (
                    <>
                      <CheckCircle size={20} className="icon-inline" style={{ color: 'white' }} />
                      Mark as Resolved
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyAlerts;