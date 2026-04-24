import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Stethoscope, Plus, Edit, Trash2, ArrowLeft, MapPin, Star, Phone, Mail, Sparkles } from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';

export default function TherapistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [aiMatch, setAiMatch] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ concerns: '', preferences: '', previous_therapy: '' });
  const [form, setForm] = useState({
    name: '', specialty: '', location: '', phone: '', email: '',
    rating: 5, accepting_patients: true, insurance: '', bio: ''
  });

  const fetchItems = async () => {
    try {
      const res = await api.get('/therapists');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/therapists/${selected.id || selected._id}`, form);
      } else {
        await api.post('/therapists', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ name: '', specialty: '', location: '', phone: '', email: '', rating: 5, accepting_patients: true, insurance: '', bio: '' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this therapist?')) return;
    try { await api.delete(`/therapists/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '', specialty: item.specialty || '', location: item.location || '',
      phone: item.phone || '', email: item.email || '', rating: item.rating || 5,
      accepting_patients: item.accepting_patients !== false, insurance: item.insurance || '',
      bio: item.bio || ''
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const handleMatch = async () => {
    setAnalyzing(true); setShowAiForm(false);
    try {
      const res = await api.post('/therapists/match', aiForm);
      setAiMatch(res.data.analysis);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  if (selected && !showForm) {
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit size={16} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.5rem', fontWeight: 700
            }}>
              {selected.name?.charAt(0) || 'T'}
            </div>
            <div>
              <h2 style={{ marginBottom: 4 }}>{selected.name}</h2>
              <p style={{ color: 'var(--primary)', fontWeight: 500 }}>{selected.specialty}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {selected.accepting_patients
                  ? <span className="badge badge-success">Accepting Patients</span>
                  : <span className="badge badge-danger">Not Accepting</span>
                }
                <span className="badge badge-warning">
                  <Star size={12} fill="#D97706" /> {selected.rating}/5
                </span>
              </div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label><MapPin size={14} /> Location</label><p>{selected.location || 'N/A'}</p></div>
            <div className="detail-field"><label><Phone size={14} /> Phone</label><p>{selected.phone || 'N/A'}</p></div>
            <div className="detail-field"><label><Mail size={14} /> Email</label><p>{selected.email || 'N/A'}</p></div>
            <div className="detail-field"><label>Insurance</label><p>{selected.insurance || 'N/A'}</p></div>
          </div>
          {selected.bio && (
            <div className="detail-field">
              <label>Bio</label>
              <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selected.bio}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Stethoscope size={28} /> Therapist Directory</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAiForm(true)}>
            <Sparkles size={18} /> AI Match
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', specialty: '', location: '', phone: '', email: '', rating: 5, accepting_patients: true, insurance: '', bio: '' }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> Add Therapist
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Stethoscope size={48} /><h3>No therapists listed</h3><p>Add therapists to your directory.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700
                }}>
                  {item.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem' }}>{item.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>{item.specialty}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <MapPin size={14} color="var(--text-lighter)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{item.location || 'No location'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {item.accepting_patients
                  ? <span className="badge badge-success">Accepting</span>
                  : <span className="badge badge-danger">Not Accepting</span>}
                <span className="badge badge-warning"><Star size={10} fill="#D97706" /> {item.rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Finding your best match...</span></div>}
      {aiMatch && <AIResponseDisplay response={aiMatch} title="AI Therapist Matching" />}

      {showAiForm && (
        <DetailModal title="Find Your Best Therapist Match" onClose={() => setShowAiForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAiForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleMatch}><Sparkles size={16} /> Find Matches</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'PTSD & Trauma', data: { concerns: 'I survived a car accident 6 months ago and now I have flashbacks, nightmares, and avoid driving. I think I have PTSD.', preferences: 'EMDR or trauma-focused CBT, in-person preferred', previous_therapy: 'none' } },
            { label: 'Couples Therapy', data: { concerns: 'My partner and I fight constantly about money and parenting. We love each other but communication has broken down completely.', preferences: 'couples therapist, Gottman method, evening availability', previous_therapy: 'some' } },
            { label: 'Teen Depression', data: { concerns: 'My 15-year-old has been withdrawing from friends, grades dropping, sleeping all day. I am worried about depression.', preferences: 'adolescent specialist, someone relatable to teens, accepts Aetna', previous_therapy: 'none' } },
            { label: 'OCD & Anxiety', data: { concerns: 'I have intrusive thoughts and compulsive checking behaviors that take hours of my day. I cannot stop worrying something terrible will happen.', preferences: 'ERP specialist, experience with OCD, affordable or sliding scale', previous_therapy: 'extensive' } },
          ]} onSelect={setAiForm} />
          <div className="form-group"><label>What are your main concerns?</label><textarea value={aiForm.concerns} onChange={e => setAiForm(f => ({ ...f, concerns: e.target.value }))} placeholder="e.g., anxiety, relationship issues, depression, work stress..." rows={3} /></div>
          <div className="form-group"><label>Any preferences?</label><input value={aiForm.preferences} onChange={e => setAiForm(f => ({ ...f, preferences: e.target.value }))} placeholder="e.g., female therapist, CBT approach, affordable..." /></div>
          <div className="form-group"><label>Previous therapy experience</label>
            <select value={aiForm.previous_therapy} onChange={e => setAiForm(f => ({ ...f, previous_therapy: e.target.value }))}>
              <option value="">Prefer not to say</option>
              <option value="none">No previous therapy</option>
              <option value="some">Some experience</option>
              <option value="extensive">Extensive experience</option>
            </select>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Therapist' : 'Add Therapist'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Therapist name" /></div>
          <div className="form-row">
            <div className="form-group"><label>Specialty</label><input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g., CBT, Anxiety" /></div>
            <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" /></div>
            <div className="form-group"><label>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Rating: {form.rating}/5</label>
              <input type="range" min="1" max="5" step="0.5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} style={{ accentColor: '#F59E0B' }} />
            </div>
            <div className="form-group"><label>Insurance</label><input value={form.insurance} onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))} placeholder="Accepted insurance" /></div>
          </div>
          <div className="form-group"><label>Bio</label><textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Therapist bio..." rows={3} /></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.accepting_patients} onChange={e => setForm(f => ({ ...f, accepting_patients: e.target.checked }))} style={{ width: 'auto' }} />
            <label style={{ margin: 0 }}>Currently Accepting Patients</label>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
