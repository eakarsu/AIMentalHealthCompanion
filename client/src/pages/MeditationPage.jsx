import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Flower2, Plus, Edit, Trash2, ArrowLeft, Play, Clock, Sparkles } from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';

export default function MeditationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [aiScript, setAiScript] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ duration: 10, focus: 'general relaxation', mood: '', experience_level: 'beginner' });
  const [form, setForm] = useState({ title: '', description: '', type: 'guided', duration: 10, difficulty: 'beginner' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/meditation');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/meditation/${selected.id || selected._id}`, form);
      } else {
        await api.post('/meditation', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ title: '', description: '', type: 'guided', duration: 10, difficulty: 'beginner' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this meditation session?')) return;
    try { await api.delete(`/meditation/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '', description: item.description || '',
      type: item.type || 'guided', duration: item.duration || 10,
      difficulty: item.difficulty || 'beginner'
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const handleGenerate = async () => {
    setAnalyzing(true); setShowAiForm(false);
    try {
      const res = await api.post('/meditation/generate', aiForm);
      setAiScript(res.data.analysis);
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
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--mint), var(--secondary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Flower2 size={36} color="#059669" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{selected.title}</h2>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <span className="badge badge-primary">{selected.type}</span>
              <span className="badge badge-success"><Clock size={12} /> {selected.duration} min</span>
              <span className="badge badge-info">{selected.difficulty}</span>
            </div>
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
        <h1><Flower2 size={28} /> Meditation Sessions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAiForm(true)}>
            <Sparkles size={18} /> AI Meditation
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', description: '', type: 'guided', duration: 10, difficulty: 'beginner' }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> New Session
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Flower2 size={48} /><h3>No meditation sessions</h3><p>Create your first meditation session.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--mint-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Flower2 size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem' }}>{item.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-lighter)' }}>{item.duration} min</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 8 }}>
                {(item.description || '').substring(0, 80)}...
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-primary">{item.type}</span>
                <span className="badge badge-info">{item.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Creating your meditation...</span></div>}
      {aiScript && <AIResponseDisplay response={aiScript} title="AI-Guided Meditation" />}

      {showAiForm && (
        <DetailModal title="Generate AI Meditation" onClose={() => setShowAiForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAiForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleGenerate}><Sparkles size={16} /> Generate</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Can\'t Sleep', data: { duration: 15, focus: 'sleep', mood: 'restless mind racing with thoughts', experience_level: 'beginner' } },
            { label: 'Pre-Meeting Anxiety', data: { duration: 5, focus: 'anxiety', mood: 'nervous about an important presentation', experience_level: 'beginner' } },
            { label: 'Deep Self-Compassion', data: { duration: 20, focus: 'self-compassion', mood: 'feeling self-critical after a mistake', experience_level: 'intermediate' } },
            { label: 'Morning Energy', data: { duration: 10, focus: 'focus and clarity', mood: 'groggy and unfocused', experience_level: 'beginner' } },
          ]} onSelect={setAiForm} />
          <div className="form-row">
            <div className="form-group"><label>Duration (min)</label><input type="number" value={aiForm.duration} onChange={e => setAiForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
            <div className="form-group"><label>Experience Level</label>
              <select value={aiForm.experience_level} onChange={e => setAiForm(f => ({ ...f, experience_level: e.target.value }))}>
                {['beginner', 'intermediate', 'advanced'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Focus</label>
            <select value={aiForm.focus} onChange={e => setAiForm(f => ({ ...f, focus: e.target.value }))}>
              {['general relaxation', 'stress relief', 'sleep', 'anxiety', 'self-compassion', 'body scan', 'gratitude', 'focus and clarity'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Current Mood (optional)</label><input value={aiForm.mood} onChange={e => setAiForm(f => ({ ...f, mood: e.target.value }))} placeholder="e.g., anxious, restless, tired..." /></div>
        </DetailModal>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Session' : 'New Meditation Session'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Session title" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the meditation..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['guided', 'unguided', 'body_scan', 'loving_kindness', 'mindfulness', 'transcendental'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Duration (min)</label><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
          </div>
          <div className="form-group"><label>Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
              {['beginner', 'intermediate', 'advanced'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
