import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { SmilePlus, Plus, Edit, Trash2, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import SampleDataButtons from '../components/SampleDataButtons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const moodLabels = ['', 'Awful', 'Bad', 'Poor', 'Low', 'Okay', 'Fair', 'Good', 'Great', 'Excellent', 'Amazing'];
const moodColors = ['', '#DC2626', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#06B6D4', '#6C63FF'];
const factors = ['Work', 'Relationships', 'Health', 'Sleep', 'Exercise', 'Diet', 'Weather', 'Social', 'Stress', 'Finances'];

const TREND_CONFIG = {
  improving: { color: '#22c55e', Icon: TrendingUp, label: 'Improving' },
  declining: { color: '#ef4444', Icon: TrendingDown, label: 'Declining' },
  stable: { color: '#6b7280', Icon: Minus, label: 'Stable' },
};

export default function MoodTracker() {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [trends, setTrends] = useState(null);
  const [form, setForm] = useState({ mood_score: 5, mood_label: 'Okay', factors: [], notes: '' });

  const fetchMoods = async () => {
    try {
      const res = await api.get('/moods');
      setMoods(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchTrends = async () => {
    try {
      const res = await api.get('/moods/trends');
      setTrends(res.data.data || res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchMoods(); fetchTrends(); }, []);

  const handleScoreChange = (score) => {
    setForm(f => ({ ...f, mood_score: score, mood_label: moodLabels[score] }));
  };

  const toggleFactor = (factor) => {
    setForm(f => ({
      ...f,
      factors: f.factors.includes(factor)
        ? f.factors.filter(x => x !== factor)
        : [...f.factors, factor]
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/moods/${selected.id || selected._id}`, form);
      } else {
        await api.post('/moods', form);
      }
      setShowForm(false);
      setEditing(false);
      setSelected(null);
      setForm({ mood_score: 5, mood_label: 'Okay', factors: [], notes: '' });
      fetchMoods();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this mood entry?')) return;
    try {
      await api.delete(`/moods/${id}`);
      setSelected(null);
      fetchMoods();
    } catch (e) { console.error(e); }
  };

  const openEdit = (mood) => {
    setForm({
      mood_score: mood.mood_score || 5,
      mood_label: mood.mood_label || '',
      factors: mood.factors || [],
      notes: mood.notes || ''
    });
    setEditing(true);
    setSelected(mood);
    setShowForm(true);
  };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  const trendConfig = trends ? TREND_CONFIG[trends.trend] || TREND_CONFIG.stable : null;

  if (selected && !showForm) {
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}>
              <Edit size={16} /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              fontSize: '3rem', fontWeight: 700,
              color: moodColors[selected.mood_score] || 'var(--primary)'
            }}>
              {selected.mood_score}/10
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selected.mood_label}</div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: 4 }}>
              {new Date(selected.created_at || selected.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Factors</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {(selected.factors || []).map(f => (
                  <span key={f} className="badge badge-primary">{f}</span>
                ))}
                {(!selected.factors || selected.factors.length === 0) && <p>None recorded</p>}
              </div>
            </div>
            <div className="detail-field">
              <label>Notes</label>
              <p>{selected.notes || 'No notes'}</p>
            </div>
          </div>
        </div>
        {selected.ai_analysis && <AIResponseDisplay response={selected.ai_analysis} title="AI Mood Analysis" />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><SmilePlus size={28} /> Mood Tracker</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ mood_score: 5, mood_label: 'Okay', factors: [], notes: '' }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> Log Mood
        </button>
      </div>

      {/* Mood Trends Chart */}
      {trends && trends.daily_averages && trends.daily_averages.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem' }}>30-Day Mood Trend</h3>
            {trendConfig && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: `${trendConfig.color}22`, color: trendConfig.color,
                border: `1px solid ${trendConfig.color}44`,
                padding: '4px 12px', borderRadius: 20, fontWeight: 600, fontSize: '0.85rem'
              }}>
                <trendConfig.Icon size={14} /> {trendConfig.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
            {trends.weekly_average != null && (
              <div><div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>30-DAY AVG</div><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{trends.weekly_average}/10</div></div>
            )}
            {trends.highest_day && (
              <div><div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>BEST DAY</div><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#22c55e' }}>{new Date(trends.highest_day.date).toLocaleDateString()} ({trends.highest_day.avg_score})</div></div>
            )}
            {trends.lowest_day && (
              <div><div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>LOWEST DAY</div><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef4444' }}>{new Date(trends.lowest_day.date).toLocaleDateString()} ({trends.lowest_day.avg_score})</div></div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends.daily_averages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}/10`, 'Mood']} labelFormatter={l => new Date(l).toLocaleDateString()} />
              <Line type="monotone" dataKey="avg_score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {moods.length === 0 ? (
        <div className="empty-state">
          <SmilePlus size={48} />
          <h3>No mood entries yet</h3>
          <p>Start tracking your moods to see patterns over time.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Date</th><th>Score</th><th>Label</th><th>Factors</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {moods.map(m => (
                  <tr key={m.id || m._id} className="clickable" onClick={() => setSelected(m)}>
                    <td>{new Date(m.created_at || m.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        background: moodColors[m.mood_score] + '22',
                        color: moodColors[m.mood_score], fontWeight: 700, fontSize: '0.85rem'
                      }}>
                        {m.mood_score}
                      </span>
                    </td>
                    <td>{m.mood_label}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(m.factors || []).slice(0, 3).map(f => (
                          <span key={f} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <DetailModal
          title={editing ? 'Edit Mood Entry' : 'Log Your Mood'}
          onClose={() => { setShowForm(false); setEditing(false); }}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? 'Update' : 'Save'}
              </button>
            </>
          }
        >
          <SampleDataButtons samples={[
            { label: 'Monday Blues', data: { mood_score: 3, mood_label: 'Poor', factors: ['Work', 'Sleep', 'Stress'], notes: 'Woke up exhausted. Dreading the week ahead. Had a terrible meeting where my ideas were shot down.' } },
            { label: 'Great Day Out', data: { mood_score: 9, mood_label: 'Excellent', factors: ['Social', 'Exercise', 'Weather'], notes: 'Went hiking with friends in perfect weather. Felt alive and connected. Best day in months.' } },
            { label: 'Anxiety Spiral', data: { mood_score: 2, mood_label: 'Bad', factors: ['Stress', 'Finances', 'Health'], notes: 'Cannot stop worrying about bills and my health test results. Heart racing all day. Could not eat.' } },
            { label: 'Peaceful Evening', data: { mood_score: 7, mood_label: 'Good', factors: ['Relationships', 'Diet', 'Exercise'], notes: 'Cooked a healthy dinner with my partner. Went for a walk. Feeling grateful and calm tonight.' } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group">
            <label>Mood Score: {form.mood_score}/10 - {moodLabels[form.mood_score]}</label>
            <input
              type="range" min="1" max="10" value={form.mood_score}
              onChange={e => handleScoreChange(Number(e.target.value))}
              style={{
                width: '100%', accentColor: moodColors[form.mood_score],
                height: 8, cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-lighter)' }}>
              <span>Awful</span><span>Amazing</span>
            </div>
          </div>

          <div className="form-group">
            <label>Contributing Factors</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {factors.map(f => (
                <button key={f} type="button"
                  className={`btn btn-sm ${form.factors.includes(f) ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => toggleFactor(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="How are you feeling? What happened today?"
              rows={3}
            />
          </div>
        </DetailModal>
      )}
    </div>
  );
}
