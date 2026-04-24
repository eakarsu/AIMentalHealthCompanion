import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { ClipboardCheck, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import SampleDataButtons from '../components/SampleDataButtons';

const assessmentTypes = {
  'PHQ-9': { name: 'PHQ-9 (Depression)', color: 'var(--lavender)', questions: 9, maxScore: 27 },
  'GAD-7': { name: 'GAD-7 (Anxiety)', color: 'var(--sky)', questions: 7, maxScore: 21 },
  'WHO-5': { name: 'WHO-5 (Well-being)', color: 'var(--mint)', questions: 5, maxScore: 25 },
};

export default function AssessmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ type: 'PHQ-9', score: 0, answers: '', notes: '' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/assessments');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, answers: form.answers ? form.answers.split(',').map(Number) : [] };
      if (editing && selected) {
        await api.put(`/assessments/${selected.id || selected._id}`, payload);
      } else {
        await api.post('/assessments', payload);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ type: 'PHQ-9', score: 0, answers: '', notes: '' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assessment?')) return;
    try { await api.delete(`/assessments/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      type: item.type || 'PHQ-9', score: item.score || 0,
      answers: (item.answers || []).join(', '), notes: item.notes || ''
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const getSeverity = (type, score) => {
    if (type === 'PHQ-9') {
      if (score <= 4) return { label: 'Minimal', color: '#059669', badge: 'badge-success' };
      if (score <= 9) return { label: 'Mild', color: '#D97706', badge: 'badge-warning' };
      if (score <= 14) return { label: 'Moderate', color: '#EA580C', badge: 'badge-warning' };
      if (score <= 19) return { label: 'Moderately Severe', color: '#DC2626', badge: 'badge-danger' };
      return { label: 'Severe', color: '#DC2626', badge: 'badge-danger' };
    }
    if (type === 'GAD-7') {
      if (score <= 4) return { label: 'Minimal', color: '#059669', badge: 'badge-success' };
      if (score <= 9) return { label: 'Mild', color: '#D97706', badge: 'badge-warning' };
      if (score <= 14) return { label: 'Moderate', color: '#EA580C', badge: 'badge-warning' };
      return { label: 'Severe', color: '#DC2626', badge: 'badge-danger' };
    }
    if (type === 'WHO-5') {
      if (score >= 13) return { label: 'Good Well-being', color: '#059669', badge: 'badge-success' };
      if (score >= 8) return { label: 'Moderate Well-being', color: '#D97706', badge: 'badge-warning' };
      return { label: 'Low Well-being', color: '#DC2626', badge: 'badge-danger' };
    }
    return { label: 'N/A', color: 'gray', badge: 'badge-primary' };
  };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  if (selected && !showForm) {
    const severity = getSeverity(selected.type, selected.score);
    const info = assessmentTypes[selected.type] || {};
    return (
      <div className="page detail-view">
        <div className="detail-header">
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit size={16} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ marginBottom: 8 }}>{info.name || selected.type}</h2>
          <p style={{ color: 'var(--text-lighter)', fontSize: '0.85rem', marginBottom: 24 }}>
            {new Date(selected.created_at || selected.createdAt).toLocaleString()}
          </p>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto 16px',
            background: `conic-gradient(${severity.color} ${(selected.score / (info.maxScore || 27)) * 100}%, var(--border-light) 0%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: 'white',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: severity.color }}>{selected.score}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter)' }}>/ {info.maxScore || '?'}</span>
            </div>
          </div>
          <span className={`badge ${severity.badge}`} style={{ fontSize: '0.88rem', padding: '6px 16px' }}>{severity.label}</span>
        </div>
        <div className="detail-grid">
          <div className="detail-field card"><label>Answers</label><p>{(selected.answers || []).join(', ') || 'N/A'}</p></div>
          <div className="detail-field card"><label>Notes</label><p>{selected.notes || 'No notes'}</p></div>
        </div>
        {(selected.ai_analysis || selected.interpretation) && (
          <AIResponseDisplay response={selected.ai_analysis || selected.interpretation} title="Assessment Interpretation" />
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><ClipboardCheck size={28} /> Assessments</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ type: 'PHQ-9', score: 0, answers: '', notes: '' }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> New Assessment
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><ClipboardCheck size={48} /><h3>No assessments yet</h3><p>Take a mental health assessment to track your progress.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Score</th><th>Severity</th></tr></thead>
              <tbody>
                {items.map(item => {
                  const sev = getSeverity(item.type, item.score);
                  return (
                    <tr key={item.id || item._id} className="clickable" onClick={() => setSelected(item)}>
                      <td>{new Date(item.created_at || item.createdAt).toLocaleDateString()}</td>
                      <td><span className="badge badge-primary">{item.type}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.score}</td>
                      <td><span className={`badge ${sev.badge}`}>{sev.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Assessment' : 'New Assessment'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Submit'}</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'PHQ-9: Moderate Depression', data: { type: 'PHQ-9', score: 14, answers: '2, 2, 1, 2, 1, 2, 1, 2, 1', notes: 'Feeling down most days. Lost interest in hobbies. Trouble concentrating at work. Sleep has been disrupted for weeks.' } },
            { label: 'GAD-7: Severe Anxiety', data: { type: 'GAD-7', score: 18, answers: '3, 3, 2, 3, 2, 3, 2', notes: 'Constant worry that I cannot control. Feeling on edge all day. Difficulty relaxing even on weekends. Irritable with family.' } },
            { label: 'WHO-5: Low Well-being', data: { type: 'WHO-5', score: 6, answers: '1, 1, 2, 1, 1', notes: 'Rarely feel cheerful. Daily life not filled with interesting things. Feel neither rested nor active. Going through the motions.' } },
            { label: 'PHQ-9: Minimal', data: { type: 'PHQ-9', score: 3, answers: '0, 1, 0, 1, 0, 0, 1, 0, 0', notes: 'Generally feeling good. Occasional low energy but nothing persistent. Sleep and appetite are normal. Functioning well.' } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group"><label>Assessment Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {Object.keys(assessmentTypes).map(t => <option key={t} value={t}>{assessmentTypes[t].name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Total Score</label>
            <input type="number" value={form.score} onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))}
              min="0" max={assessmentTypes[form.type]?.maxScore || 27} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-lighter)' }}>Max: {assessmentTypes[form.type]?.maxScore || 27}</span>
          </div>
          <div className="form-group"><label>Individual Answers (comma-separated scores)</label>
            <input value={form.answers} onChange={e => setForm(f => ({ ...f, answers: e.target.value }))} placeholder="e.g., 0, 1, 2, 1, 3, 2, 1" />
          </div>
          <div className="form-group"><label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." rows={3} />
          </div>
        </DetailModal>
      )}
    </div>
  );
}
