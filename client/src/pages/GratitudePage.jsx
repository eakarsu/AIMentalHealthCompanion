import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';
import { Sparkles, Plus, Edit, Trash2, ArrowLeft, Heart, Calendar, TrendingUp, Lightbulb } from 'lucide-react';

const dailyPrompts = [
  "What made you smile today?",
  "Who is someone you are thankful to have in your life?",
  "What is a small comfort you enjoyed today?",
  "What is something about your health you are grateful for?",
  "What recent experience taught you something valuable?",
  "What is a skill or ability you are thankful to have?",
  "What is something in nature that brought you peace recently?",
  "What act of kindness did you witness or receive?",
  "What challenge helped you grow as a person?",
  "What is something you have now that you once wished for?",
];

function getTodayPrompt() {
  const day = new Date().getDate();
  return dailyPrompts[day % dailyPrompts.length];
}

const categoryLabels = {
  personal: 'Personal', relationships: 'Relationships', health: 'Health',
  work: 'Work', nature: 'Nature', other: 'Other',
};

const catColors = {
  personal: 'var(--peach-light)', relationships: 'var(--lavender-light)',
  health: 'var(--mint-light)', work: 'var(--sky-light)',
  nature: '#F0FAF7', other: '#FEF3C7',
};

export default function GratitudePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'personal', intensity: 5 });

  const fetchItems = async () => {
    try {
      const res = await api.get('/gratitude');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/gratitude/${selected.id || selected._id}`, form);
      } else {
        await api.post('/gratitude', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ title: '', content: '', category: 'personal', intensity: 5 });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try { await api.delete(`/gratitude/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res = await api.post(`/gratitude/${selected.id || selected._id}/analyze`);
      setSelected({ ...selected, ai_analysis: res.data.analysis });
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '', content: item.entry_text || item.content || '',
      category: item.category || 'personal', intensity: item.intensity || 5,
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const openNew = (promptText) => {
    setForm({ title: '', content: promptText || '', category: 'personal', intensity: 5 });
    setEditing(false); setShowForm(true);
  };

  const thisWeek = items.filter(i => {
    const d = new Date(i.created_at || i.createdAt);
    return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });
  const avgIntensity = items.length > 0
    ? (items.reduce((sum, i) => sum + (i.intensity || 5), 0) / items.length).toFixed(1) : 0;

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  if (selected && !showForm) {
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleAnalyze} disabled={analyzing}>
              <Sparkles size={16} /> {analyzing ? 'Analyzing...' : 'AI Insights'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit size={16} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Sparkles size={32} color="#F59E0B" style={{ marginBottom: 8 }} />
            <h2>{selected.title || 'Gratitude Entry'}</h2>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
              <span className="badge badge-warning">{categoryLabels[selected.category] || selected.category}</span>
              <span className="badge badge-primary">Intensity: {selected.intensity || 5}/10</span>
              <span style={{ color: 'var(--text-lighter)', fontSize: '0.82rem' }}>
                {new Date(selected.created_at || selected.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="detail-field">
            <label>What are you grateful for?</label>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
              {selected.entry_text || selected.content}
            </p>
          </div>
        </div>
        {analyzing && <div className="loading-container"><div className="spinner"></div><span style={{ marginLeft: 12 }}>Generating insights...</span></div>}
        {selected.ai_analysis && <AIResponseDisplay response={selected.ai_analysis} title="Gratitude Insights" />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Sparkles size={28} /> Gratitude Log</h1>
        <button className="btn btn-primary" onClick={() => openNew('')}><Plus size={18} /> New Entry</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #FCD34D', cursor: 'pointer' }} onClick={() => openNew(getTodayPrompt())}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Lightbulb size={20} color="#D97706" />
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#92400E' }}>Today's Prompt</span>
          </div>
          <p style={{ fontSize: '1rem', color: '#78350F', lineHeight: 1.6, fontStyle: 'italic' }}>"{getTodayPrompt()}"</p>
          <p style={{ fontSize: '0.78rem', color: '#A16207', marginTop: 8 }}>Click to start writing</p>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--lavender-light)', border: '1px solid var(--lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} color="var(--primary)" />
          </div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{items.length}</div><div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>Total Entries</div></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--mint-light)', border: '1px solid var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} color="#059669" />
          </div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{thisWeek.length}</div><div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>This Week</div></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--peach-light)', border: '1px solid var(--peach)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={22} color="var(--accent)" />
          </div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{avgIntensity}</div><div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>Avg Intensity</div></div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Sparkles size={48} color="var(--text-lighter)" style={{ marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>Start Your Gratitude Practice</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
            Research shows that writing down things you are grateful for can improve mood, reduce stress, and increase overall well-being.
          </p>
          <button className="btn btn-primary" onClick={() => openNew(getTodayPrompt())}><Sparkles size={18} /> Write Your First Entry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)} style={{ background: catColors[item.category] || 'white' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>{item.title || 'Gratitude Entry'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 10, lineHeight: 1.5 }}>
                {(item.entry_text || item.content || '').substring(0, 100)}{(item.entry_text || '').length > 100 ? '...' : ''}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-warning">{categoryLabels[item.category] || item.category}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: Math.min(item.intensity || 0, 5) }, (_, i) => (
                    <Heart key={i} size={12} fill="var(--accent)" color="var(--accent)" />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', marginTop: 8 }}>
                {new Date(item.created_at || item.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Entry' : 'New Gratitude Entry'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Stranger Kindness', data: { title: 'A Stranger Paid for My Coffee', content: 'I was having the worst morning - running late, spilled coffee on my shirt, forgot my wallet. When I got to the cafe and realized I had no money, the person behind me just smiled and said they would cover it. Such a small gesture but it completely turned my day around. It reminded me that there is so much kindness in the world.', category: 'personal', intensity: 8 } },
            { label: 'Health Recovery', data: { title: 'Finally Pain-Free After Surgery', content: 'After months of chronic back pain and a scary surgery, I woke up this morning and realized I could move without wincing. I went for a walk around the block - something I could not do for 6 months. I cried tears of joy. I will never take the ability to walk pain-free for granted again.', category: 'health', intensity: 10 } },
            { label: 'Friend Support', data: { title: 'My Best Friend Showed Up When I Needed Her', content: 'After my breakup, I was a mess. I did not even ask for help but Sarah just showed up at my door with ice cream and blankets. She sat with me for hours while I cried and did not try to fix anything. She just listened. Having someone who truly cares is the greatest gift.', category: 'relationships', intensity: 9 } },
            { label: 'Nature Moment', data: { title: 'Sunset That Stopped Me in My Tracks', content: 'I was rushing home from work, stressed and anxious, when the sky turned the most incredible shades of pink and gold. I actually pulled over just to watch. For five minutes, all my worries disappeared. Nature has a way of reminding me how small my problems are in the grand scheme of things.', category: 'nature', intensity: 7 } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., A Kind Gesture, Beautiful Sunset..." /></div>
          <div className="form-group"><label>What are you grateful for?</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Describe what you're grateful for and why it matters to you..." rows={5} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {Object.entries(categoryLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div className="form-group"><label>How grateful do you feel? {form.intensity}/10</label>
              <input type="range" min="1" max="10" value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))} style={{ accentColor: 'var(--accent)' }} />
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
