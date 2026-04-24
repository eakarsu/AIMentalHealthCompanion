import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Shield, Plus, Edit, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';

export default function CopingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ situation: '', current_mood: '', intensity: 5 });
  const [form, setForm] = useState({ name: '', description: '', category: 'cognitive', effectiveness: 5, situation: '' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/coping');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/coping/${selected.id || selected._id}`, form);
      } else {
        await api.post('/coping', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ name: '', description: '', category: 'cognitive', effectiveness: 5, situation: '' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this strategy?')) return;
    try { await api.delete(`/coping/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '', description: item.description || '',
      category: item.category || 'cognitive', effectiveness: item.effectiveness || 5,
      situation: item.situation || ''
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const handleSuggest = async () => {
    setAnalyzing(true); setShowAiForm(false);
    try {
      const res = await api.post('/coping/suggest', aiForm);
      setAiSuggestion(res.data.analysis);
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
          <h2 style={{ marginBottom: 8 }}>{selected.name || selected.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span className="badge badge-primary">{selected.category}</span>
            <span className="badge badge-success">Effectiveness: {selected.effectiveness}/10</span>
          </div>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Description</label>
              <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selected.description || 'No description'}</p>
            </div>
            <div className="detail-field">
              <label>Best For Situations</label>
              <p>{selected.situation || 'General use'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Shield size={28} /> Coping Strategies</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAiForm(true)}>
            <Sparkles size={18} /> AI Suggest
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', category: 'cognitive', effectiveness: 5, situation: '' }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> New Strategy
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Shield size={48} /><h3>No coping strategies</h3><p>Build your coping toolkit.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Effectiveness</th><th>Situation</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id || item._id} className="clickable" onClick={() => setSelected(item)}>
                    <td style={{ fontWeight: 500 }}>{item.name || item.title}</td>
                    <td><span className="badge badge-primary">{item.category}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--border-light)' }}>
                          <div style={{ width: `${(item.effectiveness || 0) * 10}%`, height: '100%', borderRadius: 3, background: 'var(--secondary)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.82rem' }}>{item.effectiveness}/10</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.situation || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Finding strategies for you...</span></div>}
      {aiSuggestion && <AIResponseDisplay response={aiSuggestion} title="AI-Suggested Coping Strategies" />}

      {showAiForm && (
        <DetailModal title="Get AI Coping Suggestions" onClose={() => setShowAiForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAiForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSuggest}><Sparkles size={16} /> Get Suggestions</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Panic Attack', data: { situation: 'I am having a panic attack at work. My heart is racing, I cannot breathe properly, and I feel like I am going to faint.', current_mood: 'panicking', intensity: 9 } },
            { label: 'Work Deadline Stress', data: { situation: 'I have a huge project deadline tomorrow and I am nowhere near done. I keep procrastinating and the pressure is building.', current_mood: 'overwhelmed and anxious', intensity: 7 } },
            { label: 'Argument with Partner', data: { situation: 'I just had a big argument with my partner about finances. We both said hurtful things and now we are not speaking.', current_mood: 'angry and hurt', intensity: 8 } },
            { label: 'Grief & Loss', data: { situation: 'I lost my grandmother last week. I am trying to be strong for my family but I break down crying at random moments.', current_mood: 'deeply sad and numb', intensity: 8 } },
          ]} onSelect={setAiForm} />
          <div className="form-group"><label>What situation are you dealing with?</label><textarea value={aiForm.situation} onChange={e => setAiForm(f => ({ ...f, situation: e.target.value }))} placeholder="e.g., Work deadline stress, social anxiety before an event..." rows={3} /></div>
          <div className="form-row">
            <div className="form-group"><label>Current Mood</label><input value={aiForm.current_mood} onChange={e => setAiForm(f => ({ ...f, current_mood: e.target.value }))} placeholder="e.g., anxious, overwhelmed..." /></div>
            <div className="form-group"><label>Intensity: {aiForm.intensity}/10</label>
              <input type="range" min="1" max="10" value={aiForm.intensity} onChange={e => setAiForm(f => ({ ...f, intensity: Number(e.target.value) }))} style={{ accentColor: 'var(--secondary)' }} />
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Strategy' : 'New Coping Strategy'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Strategy name" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="How to use this strategy..." rows={3} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['cognitive', 'behavioral', 'emotional', 'social', 'physical', 'mindfulness'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Effectiveness: {form.effectiveness}/10</label>
              <input type="range" min="1" max="10" value={form.effectiveness} onChange={e => setForm(f => ({ ...f, effectiveness: Number(e.target.value) }))} style={{ accentColor: 'var(--secondary)' }} />
            </div>
          </div>
          <div className="form-group"><label>Best For Situation</label><input value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))} placeholder="e.g., Anxiety attacks, Work stress" /></div>
        </DetailModal>
      )}
    </div>
  );
}
