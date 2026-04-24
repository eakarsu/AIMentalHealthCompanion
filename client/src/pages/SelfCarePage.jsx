import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Heart, Plus, Edit, Trash2, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';

export default function SelfCarePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [aiRec, setAiRec] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ mood: '', energy_level: 'medium', available_time: 30, concerns: '' });
  const [form, setForm] = useState({ title: '', description: '', category: 'physical', duration: 15, frequency: 'daily', completed: false });

  const fetchItems = async () => {
    try {
      const res = await api.get('/selfcare');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/selfcare/${selected.id || selected._id}`, form);
      } else {
        await api.post('/selfcare', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ title: '', description: '', category: 'physical', duration: 15, frequency: 'daily', completed: false });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try { await api.delete(`/selfcare/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '', description: item.description || '',
      category: item.category || 'physical', duration: item.duration || 15,
      frequency: item.frequency || 'daily', completed: item.completed || false
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const handleRecommend = async () => {
    setAnalyzing(true); setShowAiForm(false);
    try {
      const res = await api.post('/selfcare/recommend', aiForm);
      setAiRec(res.data.analysis);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const catColors = {
    physical: { bg: 'var(--peach-light)', color: 'var(--accent)', badge: 'badge-danger' },
    emotional: { bg: 'var(--lavender-light)', color: 'var(--primary)', badge: 'badge-primary' },
    social: { bg: 'var(--sky-light)', color: '#2563EB', badge: 'badge-info' },
    spiritual: { bg: 'var(--mint-light)', color: '#059669', badge: 'badge-success' },
    mental: { bg: '#FEF3C7', color: '#D97706', badge: 'badge-warning' },
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
          <h2 style={{ marginBottom: 8 }}>{selected.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span className={`badge ${catColors[selected.category]?.badge || 'badge-primary'}`}>{selected.category}</span>
            <span className="badge badge-info">{selected.duration} min</span>
            <span className="badge badge-warning">{selected.frequency}</span>
            {selected.completed && <span className="badge badge-success"><CheckCircle size={12} /> Done</span>}
          </div>
          <div className="detail-field">
            <label>Description</label>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selected.description || 'No description'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Heart size={28} /> Self-Care Activities</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAiForm(true)}>
            <Sparkles size={18} /> AI Recommend
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', description: '', category: 'physical', duration: 15, frequency: 'daily', completed: false }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> New Activity
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Heart size={48} /><h3>No self-care activities</h3><p>Start building your self-care routine.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}
              style={{ borderLeft: `4px solid ${catColors[item.category]?.color || 'var(--primary)'}` }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 8 }}>
                {(item.description || '').substring(0, 80)}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={`badge ${catColors[item.category]?.badge || 'badge-primary'}`}>{item.category}</span>
                <span className="badge badge-info">{item.duration} min</span>
                {item.completed && <span className="badge badge-success">Done</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Getting personalized recommendations...</span></div>}
      {aiRec && <AIResponseDisplay response={aiRec} title="Personalized Self-Care Recommendations" />}

      {showAiForm && (
        <DetailModal title="Get AI Recommendations" onClose={() => setShowAiForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAiForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleRecommend}><Sparkles size={16} /> Get Recommendations</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Burnout & Exhausted', data: { mood: 'exhausted and burned out from work', energy_level: 'very low', available_time: 20, concerns: 'I have been working 60-hour weeks and feel completely drained. I cannot concentrate and feel emotionally numb.' } },
            { label: 'Sunday Anxiety', data: { mood: 'anxious about the upcoming week', energy_level: 'medium', available_time: 45, concerns: 'Every Sunday evening I get anxious about Monday. I want to build a calming routine for Sunday nights.' } },
            { label: 'Lonely & Isolated', data: { mood: 'lonely and disconnected', energy_level: 'low', available_time: 60, concerns: 'I work from home and haven not seen friends in weeks. I feel isolated and my mood is dropping.' } },
            { label: 'Post-Breakup', data: { mood: 'heartbroken and lost', energy_level: 'low', available_time: 30, concerns: 'Going through a breakup. I need gentle activities that help me process emotions without overwhelming me.' } },
          ]} onSelect={setAiForm} />
          <div className="form-group"><label>How are you feeling right now?</label><input value={aiForm.mood} onChange={e => setAiForm(f => ({ ...f, mood: e.target.value }))} placeholder="e.g., tired, anxious, restless..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Energy Level</label>
              <select value={aiForm.energy_level} onChange={e => setAiForm(f => ({ ...f, energy_level: e.target.value }))}>
                {['very low', 'low', 'medium', 'high'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Available Time (min)</label><input type="number" value={aiForm.available_time} onChange={e => setAiForm(f => ({ ...f, available_time: Number(e.target.value) }))} /></div>
          </div>
          <div className="form-group"><label>Any specific concerns?</label><textarea value={aiForm.concerns} onChange={e => setAiForm(f => ({ ...f, concerns: e.target.value }))} placeholder="e.g., trouble sleeping, feeling overwhelmed..." rows={3} /></div>
        </DetailModal>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Activity' : 'New Self-Care Activity'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Activity title" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the activity..." rows={3} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['physical', 'emotional', 'social', 'spiritual', 'mental'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Duration (min)</label><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Frequency</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                {['daily', 'weekly', 'biweekly', 'monthly', 'as_needed'].map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 28 }}>
              <input type="checkbox" checked={form.completed} onChange={e => setForm(f => ({ ...f, completed: e.target.checked }))} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Completed</label>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
