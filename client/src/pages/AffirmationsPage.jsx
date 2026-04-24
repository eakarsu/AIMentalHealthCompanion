import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Sun, Plus, Edit, Trash2, ArrowLeft, Heart, RefreshCw, Sparkles } from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';

export default function AffirmationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [dailyAffirmation, setDailyAffirmation] = useState(null);
  const [aiGenerated, setAiGenerated] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ focus_area: '', current_challenge: '', preferred_tone: 'warm and empowering' });
  const [form, setForm] = useState({ text: '', category: 'self_love', is_favorite: false });

  const fetchItems = async () => {
    try {
      const res = await api.get('/affirmations');
      const data = res.data.data || res.data || [];
      setItems(data);
      if (data.length > 0) {
        setDailyAffirmation(data[Math.floor(Math.random() * data.length)]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/affirmations/${selected.id || selected._id}`, form);
      } else {
        await api.post('/affirmations', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ text: '', category: 'self_love', is_favorite: false });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this affirmation?')) return;
    try { await api.delete(`/affirmations/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      text: item.text || '', category: item.category || 'self_love',
      is_favorite: item.is_favorite || false
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const handleGenerate = async () => {
    setAnalyzing(true); setShowAiForm(false);
    try {
      const res = await api.post('/affirmations/generate', aiForm);
      setAiGenerated(res.data.analysis);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const shuffleDaily = () => {
    if (items.length > 0) {
      setDailyAffirmation(items[Math.floor(Math.random() * items.length)]);
    }
  };

  const catColors = {
    self_love: 'var(--peach-light)', confidence: 'var(--lavender-light)',
    gratitude: 'var(--mint-light)', strength: 'var(--sky-light)',
    peace: '#F0FAF7', growth: '#FEF3C7'
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
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Sun size={40} color="#F59E0B" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: '1.3rem', fontWeight: 500, lineHeight: 1.6, fontStyle: 'italic', marginBottom: 16 }}>
            "{selected.text}"
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <span className="badge badge-warning">{(selected.category || '').replace(/_/g, ' ')}</span>
            {selected.is_favorite && <span className="badge badge-danger"><Heart size={12} /> Favorite</span>}
          </div>
          <p style={{ color: 'var(--text-lighter)', fontSize: '0.82rem', marginTop: 12 }}>
            {new Date(selected.created_at || selected.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {dailyAffirmation && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7, var(--peach-light))',
          borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: 24,
          textAlign: 'center', border: '1px solid #FDE68A', position: 'relative'
        }}>
          <Sun size={28} color="#F59E0B" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '0.9rem', color: '#92400E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Affirmation</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 500, fontStyle: 'italic', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            "{dailyAffirmation.text}"
          </p>
          <button onClick={shuffleDaily} className="btn btn-outline btn-sm" style={{ marginTop: 16, background: 'white' }}>
            <RefreshCw size={14} /> New Affirmation
          </button>
        </div>
      )}

      <div className="page-header">
        <h1><Sun size={28} /> Affirmations</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAiForm(true)}>
            <Sparkles size={18} /> AI Generate
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ text: '', category: 'self_love', is_favorite: false }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> New Affirmation
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Sun size={48} /><h3>No affirmations</h3><p>Add your first positive affirmation.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}
              style={{ background: catColors[item.category] || 'white' }}>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.6 }}>
                "{item.text}"
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-warning">{(item.category || '').replace(/_/g, ' ')}</span>
                {item.is_favorite && <Heart size={16} color="var(--accent)" fill="var(--accent)" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Generating personalized affirmations...</span></div>}
      {aiGenerated && <AIResponseDisplay response={aiGenerated} title="AI-Generated Affirmations" />}

      {showAiForm && (
        <DetailModal title="Generate Personalized Affirmations" onClose={() => setShowAiForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAiForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleGenerate}><Sparkles size={16} /> Generate</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Imposter Syndrome', data: { focus_area: 'confidence', current_challenge: 'I just got promoted but I feel like a fraud. Everyone around me seems more qualified and I am terrified they will find out I do not belong.', preferred_tone: 'bold and confident' } },
            { label: 'Body Image', data: { focus_area: 'self-love', current_challenge: 'I have been comparing myself to others on social media and feeling terrible about my body. I want to learn to love myself as I am.', preferred_tone: 'warm and empowering' } },
            { label: 'Recovering from Trauma', data: { focus_area: 'strength', current_challenge: 'I am recovering from a difficult childhood and sometimes feel broken. I need reminders that I am healing and worthy.', preferred_tone: 'gentle and soothing' } },
            { label: 'Career Transition', data: { focus_area: 'career', current_challenge: 'I am leaving a stable job to pursue my passion and everyone thinks I am crazy. I need courage to trust my own path.', preferred_tone: 'bold and confident' } },
          ]} onSelect={setAiForm} />
          <div className="form-group"><label>What area do you want to focus on?</label>
            <select value={aiForm.focus_area} onChange={e => setAiForm(f => ({ ...f, focus_area: e.target.value }))}>
              <option value="">General well-being</option>
              {['self-love', 'confidence', 'anxiety relief', 'strength', 'relationships', 'career', 'health', 'forgiveness'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group"><label>What challenge are you facing?</label><textarea value={aiForm.current_challenge} onChange={e => setAiForm(f => ({ ...f, current_challenge: e.target.value }))} placeholder="e.g., I struggle with self-doubt at work..." rows={3} /></div>
          <div className="form-group"><label>Preferred Tone</label>
            <select value={aiForm.preferred_tone} onChange={e => setAiForm(f => ({ ...f, preferred_tone: e.target.value }))}>
              {['warm and empowering', 'gentle and soothing', 'bold and confident', 'spiritual and grounding'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Affirmation' : 'New Affirmation'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Affirmation Text</label>
            <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="I am worthy of love and happiness..." rows={3} />
          </div>
          <div className="form-group"><label>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {['self_love', 'confidence', 'gratitude', 'strength', 'peace', 'growth'].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.is_favorite} onChange={e => setForm(f => ({ ...f, is_favorite: e.target.checked }))} style={{ width: 'auto' }} />
            <label style={{ margin: 0 }}>Mark as Favorite</label>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
