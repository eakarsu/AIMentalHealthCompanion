import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Wind, Plus, Edit, Trash2, ArrowLeft, Play, Sparkles } from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';

export default function BreathingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('');
  const [aiRec, setAiRec] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ current_feeling: '', stress_level: 5, goal: 'feel calmer' });
  const [form, setForm] = useState({ name: '', description: '', inhale_duration: 4, hold_duration: 4, exhale_duration: 4, rounds: 5, technique: 'box' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/breathing');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/breathing/${selected.id || selected._id}`, form);
      } else {
        await api.post('/breathing', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ name: '', description: '', inhale_duration: 4, hold_duration: 4, exhale_duration: 4, rounds: 5, technique: 'box' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exercise?')) return;
    try { await api.delete(`/breathing/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '', description: item.description || '',
      inhale_duration: item.inhale_duration || 4, hold_duration: item.hold_duration || 4,
      exhale_duration: item.exhale_duration || 4, rounds: item.rounds || 5,
      technique: item.technique || 'box'
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const startBreathing = () => {
    setBreathing(true);
    const inhale = selected?.inhale_duration || 4;
    const hold = selected?.hold_duration || 4;
    const exhale = selected?.exhale_duration || 4;
    const rounds = selected?.rounds || 5;
    let round = 0;

    const runRound = () => {
      if (round >= rounds) { setBreathing(false); setBreathPhase('Complete!'); return; }
      setBreathPhase('Breathe In...');
      setTimeout(() => {
        setBreathPhase('Hold...');
        setTimeout(() => {
          setBreathPhase('Breathe Out...');
          setTimeout(() => { round++; runRound(); }, exhale * 1000);
        }, hold * 1000);
      }, inhale * 1000);
    };
    runRound();
  };

  const handleRecommend = async () => {
    setAnalyzing(true); setShowAiForm(false);
    try {
      const res = await api.post('/breathing/recommend', aiForm);
      setAiRec(res.data.analysis);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  if (selected && !showForm) {
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => { setSelected(null); setBreathing(false); setBreathPhase(''); }}><ArrowLeft size={16} /> Back</button>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit size={16} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>{selected.name || selected.title}</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>{selected.description}</p>

          <div style={{
            width: 200, height: 200, borderRadius: '50%', margin: '0 auto 24px',
            background: breathing
              ? `radial-gradient(circle, var(--secondary-light), var(--primary-light))`
              : 'var(--lavender-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 1s ease',
            animation: breathing ? 'breathe 4s ease infinite' : 'none',
            border: '3px solid var(--lavender)'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
              {breathPhase || 'Ready'}
            </span>
          </div>

          <div className="detail-grid" style={{ textAlign: 'left' }}>
            <div className="detail-field"><label>Technique</label><p>{selected.technique}</p></div>
            <div className="detail-field"><label>Inhale</label><p>{selected.inhale_duration}s</p></div>
            <div className="detail-field"><label>Hold</label><p>{selected.hold_duration}s</p></div>
            <div className="detail-field"><label>Exhale</label><p>{selected.exhale_duration}s</p></div>
            <div className="detail-field"><label>Rounds</label><p>{selected.rounds}</p></div>
          </div>

          {!breathing && (
            <button className="btn btn-primary btn-lg" onClick={startBreathing}>
              <Play size={20} /> Start Exercise
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Wind size={28} /> Breathing Exercises</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAiForm(true)}>
            <Sparkles size={18} /> AI Recommend
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', inhale_duration: 4, hold_duration: 4, exhale_duration: 4, rounds: 5, technique: 'box' }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> New Exercise
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Wind size={48} /><h3>No breathing exercises</h3><p>Add your first breathing exercise.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--sky-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Wind size={22} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem' }}>{item.name || item.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-lighter)' }}>{item.technique}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 8 }}>
                {(item.description || '').substring(0, 80)}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-info">{item.inhale_duration}s / {item.hold_duration}s / {item.exhale_duration}s</span>
                <span className="badge badge-primary">{item.rounds} rounds</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Finding the best exercise for you...</span></div>}
      {aiRec && <AIResponseDisplay response={aiRec} title="AI Breathing Recommendation" />}

      {showAiForm && (
        <DetailModal title="Get AI Breathing Recommendation" onClose={() => setShowAiForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAiForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleRecommend}><Sparkles size={16} /> Get Recommendation</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Panic Attack Now', data: { current_feeling: 'having a panic attack, heart racing, cannot breathe', stress_level: 10, goal: 'manage panic' } },
            { label: 'Insomnia', data: { current_feeling: 'wide awake at 2am, mind racing with tomorrow worries', stress_level: 7, goal: 'fall asleep' } },
            { label: 'Pre-Exam Nerves', data: { current_feeling: 'extremely nervous about an exam in 30 minutes', stress_level: 8, goal: 'reduce anxiety' } },
            { label: 'Afternoon Slump', data: { current_feeling: 'drowsy and unfocused after lunch', stress_level: 3, goal: 'increase energy' } },
          ]} onSelect={setAiForm} />
          <div className="form-group"><label>How are you feeling right now?</label><input value={aiForm.current_feeling} onChange={e => setAiForm(f => ({ ...f, current_feeling: e.target.value }))} placeholder="e.g., anxious, panicky, tense, can't sleep..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Stress Level: {aiForm.stress_level}/10</label>
              <input type="range" min="1" max="10" value={aiForm.stress_level} onChange={e => setAiForm(f => ({ ...f, stress_level: Number(e.target.value) }))} style={{ accentColor: 'var(--primary)' }} />
            </div>
            <div className="form-group"><label>Goal</label>
              <select value={aiForm.goal} onChange={e => setAiForm(f => ({ ...f, goal: e.target.value }))}>
                {['feel calmer', 'reduce anxiety', 'fall asleep', 'increase energy', 'improve focus', 'manage panic'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Exercise' : 'New Breathing Exercise'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Exercise name" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the exercise..." rows={3} /></div>
          <div className="form-group"><label>Technique</label>
            <select value={form.technique} onChange={e => setForm(f => ({ ...f, technique: e.target.value }))}>
              {['box', '4-7-8', 'deep', 'alternate_nostril', 'diaphragmatic', 'pursed_lip'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Inhale (sec)</label><input type="number" value={form.inhale_duration} onChange={e => setForm(f => ({ ...f, inhale_duration: Number(e.target.value) }))} /></div>
            <div className="form-group"><label>Hold (sec)</label><input type="number" value={form.hold_duration} onChange={e => setForm(f => ({ ...f, hold_duration: Number(e.target.value) }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Exhale (sec)</label><input type="number" value={form.exhale_duration} onChange={e => setForm(f => ({ ...f, exhale_duration: Number(e.target.value) }))} /></div>
            <div className="form-group"><label>Rounds</label><input type="number" value={form.rounds} onChange={e => setForm(f => ({ ...f, rounds: Number(e.target.value) }))} /></div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
