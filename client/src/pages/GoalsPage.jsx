import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { Target, Plus, Edit, Trash2, ArrowLeft, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import SampleDataButtons from '../components/SampleDataButtons';

export default function GoalsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [aiCoaching, setAiCoaching] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'emotional', target_date: '', status: 'active', progress: 0 });

  const fetchItems = async () => {
    try {
      const res = await api.get('/goals');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/goals/${selected.id || selected._id}`, form);
      } else {
        await api.post('/goals', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ title: '', description: '', category: 'emotional', target_date: '', status: 'active', progress: 0 });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try { await api.delete(`/goals/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '', description: item.description || '',
      category: item.category || 'emotional',
      target_date: item.target_date ? item.target_date.substring(0, 10) : '',
      status: item.status || 'active', progress: item.progress || 0
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const handleCoach = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res = await api.post(`/goals/${selected.id || selected._id}/coach`);
      setAiCoaching(res.data.analysis);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const statusBadge = { active: 'badge-primary', completed: 'badge-success', paused: 'badge-warning', cancelled: 'badge-danger' };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  if (selected && !showForm) {
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => { setSelected(null); setAiCoaching(null); }}><ArrowLeft size={16} /> Back</button>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleCoach} disabled={analyzing}>
              <Sparkles size={16} /> {analyzing ? 'Coaching...' : 'AI Coach'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit size={16} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 8 }}>{selected.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <span className={`badge ${statusBadge[selected.status] || 'badge-primary'}`}>{selected.status}</span>
            <span className="badge badge-info">{selected.category}</span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
              <span>Progress</span>
              <span style={{ fontWeight: 600 }}>{selected.progress || 0}%</span>
            </div>
            <div style={{ width: '100%', height: 10, background: 'var(--border-light)', borderRadius: 5 }}>
              <div style={{
                width: `${selected.progress || 0}%`, height: '100%', borderRadius: 5,
                background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Description</label><p style={{ whiteSpace: 'pre-wrap' }}>{selected.description || 'No description'}</p></div>
            <div className="detail-field"><label>Target Date</label><p>{selected.target_date ? new Date(selected.target_date).toLocaleDateString() : 'Not set'}</p></div>
          </div>
        </div>
        {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Getting AI coaching...</span></div>}
        {aiCoaching && <AIResponseDisplay response={aiCoaching} title="AI Goal Coach" />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Target size={28} /> Goals</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ title: '', description: '', category: 'emotional', target_date: '', status: 'active', progress: 0 }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> New Goal
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Target size={48} /><h3>No goals yet</h3><p>Set your first mental health goal.</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {item.status === 'completed'
                ? <CheckCircle2 size={24} color="#059669" />
                : <Circle size={24} color="var(--text-lighter)" />
              }
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{item.title}</h3>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${statusBadge[item.status] || 'badge-primary'}`}>{item.status}</span>
                  <span className="badge badge-info">{item.category}</span>
                </div>
              </div>
              <div style={{ width: 80 }}>
                <div style={{ fontSize: '0.8rem', textAlign: 'right', marginBottom: 4, color: 'var(--text-light)' }}>{item.progress || 0}%</div>
                <div style={{ width: '100%', height: 6, background: 'var(--border-light)', borderRadius: 3 }}>
                  <div style={{ width: `${item.progress || 0}%`, height: '100%', borderRadius: 3, background: 'var(--secondary)' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Goal' : 'New Goal'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Overcome Social Anxiety', data: { title: 'Attend one social event per week', description: 'I avoid social situations because of anxiety. My goal is to gradually expose myself by attending at least one social event weekly - starting small with coffee with a friend, then working up to parties and networking events.', category: 'social', target_date: '2026-06-30', status: 'active', progress: 15 } },
            { label: 'Build Meditation Habit', data: { title: 'Meditate 20 minutes daily for 90 days', description: 'I want to develop a consistent meditation practice to manage my anxiety and improve focus. Starting with 5 minutes and building up. Using guided apps first then transitioning to unguided sitting.', category: 'spiritual', target_date: '2026-06-17', status: 'active', progress: 30 } },
            { label: 'Therapy Commitment', data: { title: 'Complete 12 weeks of CBT therapy', description: 'I have been putting off therapy for years. This time I am committing to a full 12-week CBT program. I want to address my depression and learn concrete coping skills. No more cancelling appointments.', category: 'emotional', target_date: '2026-06-01', status: 'active', progress: 40 } },
            { label: 'Exercise for Mental Health', data: { title: 'Run 3 times per week for mood management', description: 'Research shows exercise is as effective as antidepressants for mild-moderate depression. My psychiatrist recommended I start running. Goal is 3x per week, 30 minutes each session. Tracking mood before and after each run.', category: 'physical', target_date: '2026-09-17', status: 'active', progress: 10 } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Goal title" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your goal..." rows={3} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['emotional', 'physical', 'social', 'professional', 'spiritual', 'cognitive'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Target Date</label><input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['active', 'completed', 'paused', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Progress: {form.progress}%</label>
              <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} style={{ accentColor: 'var(--primary)' }} />
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
