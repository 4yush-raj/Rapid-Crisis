import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { predictPriority, recommendServices } from '../utils/incidentClassifier';
import { AlertCircle, MapPin, UploadCloud, Info, CheckCircle2 } from 'lucide-react';

const CreateIncident = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const priority = predictPriority(formData.title, formData.description);
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('location', formData.location);
      submitData.append('priority', priority);
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      await api.post('incidents/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate(user?.role === 'admin' || user?.role === 'staff' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      console.error(err);
      navigate(user?.role === 'admin' || user?.role === 'staff' ? '/admin/dashboard' : '/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-wide">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.65rem', borderRadius: '1rem', display: 'flex' }}>
              <AlertCircle size={28} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Report New Incident</h1>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '4rem', marginTop: 0 }}>Provide detailed information to help responders act quickly and effectively.</p>
        </div>
      </div>
      
      <div className="card-surface" style={{ padding: '2.5rem 3rem' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2.5fr', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={18} style={{ color: 'var(--color-primary)' }}/> Basic Details
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Enter the title and exact location of the incident.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="title">Incident Title</label>
                <input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Fire in kitchen" className="form-input" />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="location" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16}/> Location</label>
                <input id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. 1st Floor East Wing" className="form-input" />
              </div>
            </div>
          </div>
          
          <hr style={{ border: 0, height: '1px', background: 'var(--border-color)', margin: '2rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2.5fr', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ color: 'var(--color-primary)' }}/> Description & Triage
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Provide a thorough description. System will auto-suggest responses.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="description">Comprehensive Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={5} placeholder="Describe the incident in detail..." className="form-textarea" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Auto Priority</label>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                    {predictPriority(formData.title, formData.description)}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Suggested Response</label>
                  <div className="service-chip-list" style={{ marginTop: '0.25rem', gap: '0.5rem' }}>
                    {recommendServices(formData.title, formData.description).map((service) => (
                      <span key={service} className="service-tag" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 600, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 0, height: '1px', background: 'var(--border-color)', margin: '2rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2.5fr', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={18} style={{ color: 'var(--color-primary)' }}/> Evidence
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Upload an image for better situation awareness (optional).</p>
            </div>
            <div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '1rem', padding: '2.5rem', textAlign: 'center', background: '#f8fafc', transition: 'all 0.2s', cursor: 'pointer', position: 'relative' }}>
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.75rem', objectFit: 'cover' }} />
                      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600 }}>Click to replace image</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--color-primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)', display: 'flex' }}>
                        <UploadCloud size={32} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Click to upload an image</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>PNG, JPG or WEBP up to 5MB</p>
                      </div>
                    </div>
                  )}
                  <input id="image" type="file" name="image" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '0.85rem 1.5rem' }}>Cancel & Go Back</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <CheckCircle2 size={18} /> {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIncident;
