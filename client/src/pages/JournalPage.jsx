import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { BookOpen, Plus, Edit, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import SampleDataButtons from '../components/SampleDataButtons';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', mood: 'neutral', tags: '' });

  const fetchEntries = async () => {
    try {
      const res = await api.get('/journal');
      setEntries(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editing && selected) {
        await api.put(`/journal/${selected.id || selected._id}`, payload);
      } else {
        await api.post('/journal', payload);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ title: '', content: '', mood: 'neutral', tags: '' });
      fetchEntries();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await api.delete(`/journal/${id}`);
      setSelected(null);
      fetchEntries();
    } catch (e) { console.error(e); }
  };

  const handleAnalyze = async (entry) => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/journal/${entry.id || entry._id}/analyze`);
      setSelected(res.data.data || res.data);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const openEdit = (entry) => {
    setForm({
      title: entry.title || '',
      content: entry.content || '',
      mood: entry.mood || 'neutral',
      tags: (entry.tags || []).join(', ')
    });
    setEditing(true); setSelected(entry); setShowForm(true);
  };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  if (selected && !showForm) {
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="detail-actions">
            <button className="btn btn-success btn-sm" onClick={() => handleAnalyze(selected)} disabled={analyzing}>
              <Sparkles size={16} /> {analyzing ? 'Analyzing...' : 'AI Analysis'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}>
              <Edit size={16} /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{selected.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{selected.mood || 'neutral'}</span>
            {(selected.tags || []).map(t => (
              <span key={t} className="badge badge-info">{t}</span>
            ))}
            <span style={{ color: 'var(--text-lighter)', fontSize: '0.82rem' }}>
              {new Date(selected.created_at || selected.createdAt).toLocaleString()}
            </span>
          </div>
          <div style={{
            background: 'var(--bg)', padding: 20, borderRadius: 'var(--radius-sm)',
            lineHeight: 1.8, whiteSpace: 'pre-wrap'
          }}>
            {selected.content}
          </div>
        </div>
        {(selected.ai_analysis || selected.analysis) && (
          <AIResponseDisplay response={selected.ai_analysis || selected.analysis} title="Journal Analysis" />
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><BookOpen size={28} /> Journal</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ title: '', content: '', mood: 'neutral', tags: '' }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> New Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No journal entries yet</h3>
          <p>Start writing to reflect on your thoughts and feelings.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {entries.map(e => (
            <div key={e.id || e._id} className="card card-clickable" onClick={() => setSelected(e)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>{e.title || 'Untitled'}</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginBottom: 8, maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.content?.substring(0, 120)}...
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{e.mood || 'neutral'}</span>
                    {(e.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="badge badge-info">{t}</span>
                    ))}
                  </div>
                </div>
                <span style={{ color: 'var(--text-lighter)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(e.created_at || e.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DetailModal
          title={editing ? 'Edit Journal Entry' : 'New Journal Entry'}
          onClose={() => { setShowForm(false); setEditing(false); }}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button>
            </>
          }
        >
          <SampleDataButtons samples={[
            { label: 'Therapy Breakthrough', data: { title: 'Finally Understanding My Patterns', content: 'Today in therapy I realized that my fear of abandonment comes from when my dad left when I was 7. Every time my partner is late or does not text back, I spiral into panic. Seeing this pattern is both painful and freeing. My therapist helped me see that I am not that scared child anymore. I have resources and coping skills now. I cried a lot but they were healing tears.', mood: 'grateful', tags: 'therapy, growth, relationships' } },
            { label: 'Workplace Burnout', data: { title: 'I Cannot Do This Anymore', content: 'Third week working 12-hour days. My boss keeps piling on work and I am too afraid to say no. I snapped at my kids tonight and felt horrible. I do not recognize myself anymore. I used to love painting and reading but I have not done either in months. Something has to change. Maybe I need to talk to HR or start looking for a new job. My health is suffering too - headaches every day, not sleeping.', mood: 'anxious', tags: 'work, stress, burnout' } },
            { label: 'Grief Journey', data: { title: 'Mom Would Have Been 65 Today', content: 'Her birthday. I baked her favorite chocolate cake and cried while mixing the batter. It has been two years but some days the grief hits like a truck. I put flowers on her grave and told her about the kids. I think she would be proud of who I am becoming. Dad called and we both pretended to be okay. I miss her laugh more than anything.', mood: 'sad', tags: 'grief, family, healing' } },
            { label: 'Recovery Milestone', data: { title: 'One Year Sober Today', content: 'I cannot believe I made it. 365 days without a drink. Last year at this time I was in the ER after a binge. Now I wake up clear-headed, I show up for my kids, I have real friendships instead of drinking buddies. It has not been easy - there were nights I white-knuckled it. But my sponsor, my group, and my own determination got me here. I am proud of myself. I deserve to say that.', mood: 'happy', tags: 'recovery, milestone, sobriety' } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Entry title" />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your thoughts..." rows={6} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mood</label>
              <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}>
                {['happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'excited', 'grateful'].map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="work, health, family" />
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
