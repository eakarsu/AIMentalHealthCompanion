import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import CrisisAlert from '../components/CrisisAlert';
import { BookOpen, Plus, Edit, Trash2, ArrowLeft, Sparkles, Brain } from 'lucide-react';
import SampleDataButtons from '../components/SampleDataButtons';

const SENTIMENT_COLORS = {
  positive: '#22c55e', negative: '#ef4444', neutral: '#6b7280', mixed: '#f59e0b'
};

function StructuredAnalysis({ analysis }) {
  if (!analysis) return null;
  if (typeof analysis === 'string') return <AIResponseDisplay response={analysis} title="Journal Analysis" />;
  if (analysis.raw) return <AIResponseDisplay response={analysis.raw} title="Journal Analysis" />;

  const sentimentColor = SENTIMENT_COLORS[analysis.sentiment] || '#6366f1';

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={18} color="var(--primary)" /> AI Journal Analysis
      </h3>

      {analysis.sentiment && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-lighter)', fontWeight: 600 }}>SENTIMENT</span>
          <span style={{
            background: `${sentimentColor}22`, color: sentimentColor,
            border: `1px solid ${sentimentColor}44`,
            padding: '3px 12px', borderRadius: 20, fontWeight: 700, textTransform: 'capitalize'
          }}>{analysis.sentiment}</span>
        </div>
      )}

      {analysis.overall_tone && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 16 }}>{analysis.overall_tone}</p>
      )}

      {Array.isArray(analysis.cognitive_distortions) && analysis.cognitive_distortions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: '#ef4444' }}>Cognitive Distortions</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {analysis.cognitive_distortions.map((d, i) => (
              <span key={i} style={{
                background: '#fee2e2', color: '#dc2626',
                padding: '2px 10px', borderRadius: 12, fontSize: '0.82rem'
              }}>{typeof d === 'string' ? d : d.name || JSON.stringify(d)}</span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(analysis.strengths_observed) && analysis.strengths_observed.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: '#22c55e' }}>Strengths Observed</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {analysis.strengths_observed.map((s, i) => (
              <span key={i} style={{
                background: '#dcfce7', color: '#16a34a',
                padding: '2px 10px', borderRadius: 12, fontSize: '0.82rem'
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(analysis.gentle_suggestions) && analysis.gentle_suggestions.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--primary)' }}>Gentle Suggestions</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {analysis.gentle_suggestions.map((s, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: '0.9rem', color: 'var(--text-light)', listStyle: 'none', paddingLeft: 4 }}>
                <input type="checkbox" style={{ marginRight: 8 }} readOnly />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CBTRecordForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ situation: '', automatic_thought: '', evidence_for: '', evidence_against: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!form.situation || !form.automatic_thought) return;
    setLoading(true);
    try {
      const res = await api.post('/journal/cbt-record', form);
      setResult(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (result) {
    const a = result.analysis;
    return (
      <div>
        <h4 style={{ color: 'var(--primary)', marginBottom: 12 }}>CBT Analysis</h4>
        {a && (
          <>
            {Array.isArray(a.cognitive_distortions) && a.cognitive_distortions.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.85rem' }}>Cognitive Distortions Found:</div>
                {a.cognitive_distortions.map((d, i) => (
                  <div key={i} style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: 8, marginBottom: 4, fontSize: '0.88rem' }}>
                    <strong>{d.name}:</strong> {d.explanation}
                  </div>
                ))}
              </div>
            )}
            {a.balanced_thought && (
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                <strong>Balanced Thought:</strong> {a.balanced_thought}
              </div>
            )}
            {a.reality_check && <p style={{ fontSize: '0.9rem', marginBottom: 8 }}><strong>Reality Check:</strong> {a.reality_check}</p>}
            {a.affirmation && (
              <div style={{ background: 'var(--lavender-light)', color: 'var(--primary)', padding: 12, borderRadius: 8, fontStyle: 'italic' }}>
                {a.affirmation}
              </div>
            )}
          </>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onSaved(); onClose(); }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="form-group"><label>Situation</label><textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))} placeholder="Describe the situation..." rows={2} /></div>
      <div className="form-group"><label>Automatic Thought</label><textarea value={form.automatic_thought} onChange={e => setForm(f => ({ ...f, automatic_thought: e.target.value }))} placeholder="What thought came automatically?" rows={2} /></div>
      <div className="form-group"><label>Evidence For this Thought</label><textarea value={form.evidence_for} onChange={e => setForm(f => ({ ...f, evidence_for: e.target.value }))} placeholder="What supports this thought?" rows={2} /></div>
      <div className="form-group"><label>Evidence Against this Thought</label><textarea value={form.evidence_against} onChange={e => setForm(f => ({ ...f, evidence_against: e.target.value }))} placeholder="What challenges this thought?" rows={2} /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.situation || !form.automatic_thought}>
          {loading ? 'Analyzing...' : 'Analyze Thought'}
        </button>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCBT, setShowCBT] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [crisisAlert, setCrisisAlert] = useState(null);
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
        const res = await api.post('/journal', payload);
        const data = res.data.data || res.data;
        if (data.crisis_alert) setCrisisAlert(data.crisis_resources || []);
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
    setAnalysisResult(null);
    try {
      const res = await api.post(`/journal/${entry.id || entry._id}/analyze`);
      const data = res.data.data || res.data;
      setAnalysisResult(data.analysis);
      if (data.crisis_alert) setCrisisAlert(data.crisis_resources || []);
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
        {crisisAlert && <CrisisAlert resources={crisisAlert} />}
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => { setSelected(null); setAnalysisResult(null); }}>
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
          <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 'var(--radius-sm)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {selected.content}
          </div>
        </div>
        {analyzing && <div className="loading-container" style={{ padding: 20 }}><div className="spinner spinner-sm"></div></div>}
        {analysisResult && <StructuredAnalysis analysis={analysisResult} />}
        {!analysisResult && (selected.ai_analysis || selected.analysis) && (
          <StructuredAnalysis analysis={selected.ai_analysis || selected.analysis} />
        )}
      </div>
    );
  }

  return (
    <div className="page">
      {crisisAlert && <CrisisAlert resources={crisisAlert} />}
      <div className="page-header">
        <h1><BookOpen size={28} /> Journal</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setShowCBT(true)}>
            <Brain size={18} /> CBT Thought Record
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', content: '', mood: 'neutral', tags: '' }); setEditing(false); setShowForm(true); }}>
            <Plus size={18} /> New Entry
          </button>
        </div>
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
            <div key={e.id || e._id} className="card card-clickable" onClick={() => { setSelected(e); setAnalysisResult(null); }}>
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
            { label: 'Workplace Burnout', data: { title: 'I Cannot Do This Anymore', content: 'Third week working 12-hour days. My boss keeps piling on work and I am too afraid to say no. I snapped at my kids tonight and felt horrible. I do not recognize myself anymore.', mood: 'anxious', tags: 'work, stress, burnout' } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Entry title" /></div>
          <div className="form-group"><label>Content</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your thoughts..." rows={6} /></div>
          <div className="form-row">
            <div className="form-group"><label>Mood</label>
              <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}>
                {['happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'excited', 'grateful'].map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Tags (comma-separated)</label><input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="work, health, family" /></div>
          </div>
        </DetailModal>
      )}

      {showCBT && (
        <DetailModal title="CBT Thought Record" onClose={() => setShowCBT(false)}>
          <CBTRecordForm onClose={() => setShowCBT(false)} onSaved={fetchEntries} />
        </DetailModal>
      )}
    </div>
  );
}
