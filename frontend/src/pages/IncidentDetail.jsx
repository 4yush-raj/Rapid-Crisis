import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { predictPriority, recommendServices } from '../utils/incidentClassifier';

const MOCK_INCIDENT = {
  id: 1, title: 'Fire Alarm Triggered', description: 'Fire alarm sounding in east wing kitchen.', priority: 'high', status: 'active', location: 'East Wing Kitchen', created_at: new Date().toISOString(), authority_contacted: false, assigned_to: null, 
  updates: [
    { id: 1, message: 'Investigating the alarm now.', updated_by_name: 'Security Admin', created_at: new Date(Date.now() - 100000).toISOString() }
  ]
};

const MOCK_STAFF = [
  { id: 1, username: 'John Fire', role: 'staff', phone: '+1-555-0101', department: 'Fire Department' },
  { id: 2, username: 'Jane Medical', role: 'staff', phone: '+1-555-0102', department: 'Medical Emergency' },
  { id: 3, username: 'Bob Security', role: 'staff', phone: '+1-555-0103', department: 'Security' },
];

const USERS = [
  { id: 1, username: 'admin' },
  { id: 2, username: 'staff_1' },
];

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateMsg, setUpdateMsg] = useState('');
  const [contacted, setContacted] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const res = await api.get(`incidents/${id}/`);
      setIncident(res.data);
      setContacted(res.data.authority_contacted);
    } catch (err) {
      console.error('API failed, showing mock data');
      setIncident(MOCK_INCIDENT);
      setContacted(MOCK_INCIDENT.authority_contacted);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.get('incidents/' + id + '/available_staff/');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to fetch staff', err);
      setStaffList(MOCK_STAFF);
    }
  };

  const handleOpenContactModal = async () => {
    setShowContactModal(true);
    await fetchStaffList();
  };

  const addUpdate = async (e) => {
    e.preventDefault();
    if (!updateMsg.trim()) return;
    try {
      const newUpdate = { id: Date.now(), message: updateMsg, updated_by_name: user?.username || 'User', created_at: new Date().toISOString() };
      setIncident({...incident, updates: [...(incident.updates || []), newUpdate]});
      setUpdateMsg('');
      await api.post(`updates/`, { incident: id, message: updateMsg });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (userId) => {
    try {
      await api.post(`incidents/${id}/assign_staff/`, { assigned_to: userId });
      setIncident({...incident, assigned_to: userId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleContactAuthority = async (e) => {
    e.preventDefault();
    if (!selectedStaff) {
      alert('Please select a staff member');
      return;
    }

    setContacted(true);
    setShowContactModal(false);
    try {
      await api.post(`incidents/${id}/contact_authority/`, {
        staff_id: selectedStaff.id,
        message: contactMessage || `Emergency contact needed for incident: ${incident.title}`
      });
    } catch (err) {
      console.error(err);
      setContacted(false);
    }
  };

  const handleMarkResolved = async () => {
    try {
      const res = await api.post(`incidents/${id}/mark_resolved/`);
      setIncident({ ...incident, status: res.data.status });
    } catch (err) {
      console.error(err);
      alert('Unable to mark the incident as resolved.');
    }
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;
  if (!incident) return <div>Incident not found.</div>;

  return (
    <div className="card-wide">
      <button className="btn btn-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="card-surface">
        <div className="panel-head">
          <div>
            <h1 className="detail-title">{incident.title}</h1>
            <div className="incident-card-meta">
              <span>{incident.location}</span>
              <span>•</span>
              <span className={`badge badge-${incident.status}`}>{incident.status}</span>
              <span className={`badge badge-${incident.priority}`}>{incident.priority}</span>
            </div>
          </div>

          <div className="panel-actions">
            <button
              className="btn btn-danger"
              onClick={handleOpenContactModal}
              disabled={contacted || user?.role === 'guest'}
            >
              {contacted ? 'Already Contacted' : 'Contact Authority'}
            </button>
            {incident.status !== 'resolved' && user?.role !== 'guest' && (
              <button className="btn btn-success" onClick={handleMarkResolved}>
                Mark as Resolved
              </button>
            )}
          </div>
        </div>

        {incident.image && (
          <div className="image-panel">
            <img src={incident.image} alt={incident.title} className="incident-card-image" />
          </div>
        )}

        <div className="content-panel">
          <h3 className="detail-title">Description</h3>
          <p className="form-note">{incident.description}</p>
        </div>

        <div className="content-panel">
          <h3 className="detail-title">Response Suggestions</h3>
          <div className="form-note suggestion-summary">
            <strong>Priority:</strong>{' '}
            <span className="capitalize">{predictPriority(incident.title, incident.description)}</span>
          </div>
          <div className="panel-actions">
            {recommendServices(incident.title, incident.description).map((service) => (
              <span key={service} className="tag-pill">
                {service}
              </span>
            ))}
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="content-panel">
            <label className="form-label">Assign Staff</label>
            <select className="form-select" onChange={(e) => handleAssign(e.target.value)} value={incident.assigned_to || ''}>
              <option value="">-- Select Staff --</option>
              {USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="content-panel">
        <h3 className="detail-title">Activity & Updates</h3>

        <div className="timeline">
          {incident.updates?.length ? (
            incident.updates.map((update) => (
              <div key={update.id} className="timeline-item">
                <div className="timeline-meta">
                  {update.updated_by_name || 'System User'} • {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                </div>
                <div className="form-note">{update.message}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No updates yet.</div>
          )}
        </div>

        {user?.role !== 'guest' && (
          <form onSubmit={addUpdate} className="form-actions">
            <input
              type="text"
              value={updateMsg}
              onChange={(e) => setUpdateMsg(e.target.value)}
              placeholder="Add an update or message..."
              className="form-input"
            />
            <button type="submit" className="btn btn-primary">
              <Send size={18} />
            </button>
          </form>
        )}
      </div>

      {showContactModal && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="modal-header">
              <h2 className="detail-title">Contact Authority</h2>
              <button type="button" className="btn btn-link modal-close" onClick={() => setShowContactModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleContactAuthority}>
              <div className="form-group">
                <label className="form-label" htmlFor="staff">Select Staff Member</label>
                <select
                  id="staff"
                  value={selectedStaff?.id || ''}
                  onChange={(e) => {
                    const staff = staffList.find((s) => s.id === parseInt(e.target.value));
                    setSelectedStaff(staff);
                  }}
                  className="form-select"
                  required
                >
                  <option value="">-- Choose a staff member --</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.username} - {staff.department}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaff && (
                <div className="info-panel">
                  <div className="info-line">
                    <strong>Name:</strong> {selectedStaff.username}
                  </div>
                  <div className="info-line">
                    <strong>Department:</strong> {selectedStaff.department}
                  </div>
                  <div className="info-line">
                    <strong>Phone:</strong> <a href={`tel:${selectedStaff.phone}`} className="text-link">{selectedStaff.phone}</a>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="message">Message (Optional)</label>
                <textarea
                  id="message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Add a message with emergency details..."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowContactModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={!selectedStaff}>
                  Send Contact Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentDetail;
