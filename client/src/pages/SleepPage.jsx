import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { Moon, Plus, Edit, Trash2, ArrowLeft, Star } from 'lucide-react';
import SampleDataButtons from '../components/SampleDataButtons';

export default function SleepPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ date: '', bedtime: '22:00', wake_time: '06:00', quality: 5, duration: 8, notes: '' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/sleep');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/sleep/${selected.id || selected._id}`, form);
      } else {
        await api.post('/sleep', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ date: '', bedtime: '22:00', wake_time: '06:00', quality: 5, duration: 8, notes: '' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sleep entry?')) return;
    try { await api.delete(`/sleep/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      date: item.date ? item.date.substring(0, 10) : '',
      bedtime: item.bedtime || '22:00', wake_time: item.wake_time || '06:00',
      quality: item.quality || 5, duration: item.duration || 8, notes: item.notes || ''
    });
    setEditing(true); setSelected(item); setShowForm(true);
  };

  const qualityColor = (q) => {
    if (q >= 8) return '#059669';
    if (q >= 6) return '#2563EB';
    if (q >= 4) return '#D97706';
    return '#DC2626';
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
        <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
          <Moon size={36} color="var(--primary)" style={{ marginBottom: 12 }} />
          <h2 style={{ marginBottom: 4 }}>{new Date(selected.date || selected.created_at || selected.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <Star key={i} size={20} fill={i < selected.quality ? qualityColor(selected.quality) : 'transparent'}
                color={i < selected.quality ? qualityColor(selected.quality) : 'var(--border)'} />
            ))}
          </div>
          <div className="detail-grid" style={{ textAlign: 'left' }}>
            <div className="detail-field"><label>Bedtime</label><p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selected.bedtime}</p></div>
            <div className="detail-field"><label>Wake Time</label><p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selected.wake_time}</p></div>
            <div className="detail-field"><label>Duration</label><p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selected.duration} hours</p></div>
            <div className="detail-field"><label>Quality</label><p style={{ fontSize: '1.1rem', fontWeight: 600, color: qualityColor(selected.quality) }}>{selected.quality}/10</p></div>
          </div>
          {selected.notes && (
            <div className="detail-field" style={{ textAlign: 'left' }}>
              <label>Notes</label>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selected.notes}</p>
            </div>
          )}
        </div>
        {selected.ai_analysis && <AIResponseDisplay response={selected.ai_analysis} title="Sleep Analysis" />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Moon size={28} /> Sleep Tracker</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ date: new Date().toISOString().substring(0, 10), bedtime: '22:00', wake_time: '06:00', quality: 5, duration: 8, notes: '' }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> Log Sleep
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Moon size={48} /><h3>No sleep entries</h3><p>Start tracking your sleep patterns.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Bedtime</th><th>Wake</th><th>Duration</th><th>Quality</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id || item._id} className="clickable" onClick={() => setSelected(item)}>
                    <td>{new Date(item.date || item.created_at || item.createdAt).toLocaleDateString()}</td>
                    <td>{item.bedtime}</td>
                    <td>{item.wake_time}</td>
                    <td>{item.duration}h</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 6, borderRadius: 3, background: 'var(--border-light)' }}>
                          <div style={{ width: `${(item.quality || 0) * 10}%`, height: '100%', borderRadius: 3, background: qualityColor(item.quality) }}></div>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: qualityColor(item.quality) }}>{item.quality}/10</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Sleep Entry' : 'Log Sleep'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <SampleDataButtons samples={[
            { label: 'Insomnia Night', data: { date: new Date().toISOString().substring(0, 10), bedtime: '23:30', wake_time: '04:15', quality: 2, duration: 3.5, notes: 'Tossed and turned for hours. Mind racing about work deadlines. Finally fell asleep around 2am but woke up at 4 and could not go back to sleep.' } },
            { label: 'Perfect Sleep', data: { date: new Date().toISOString().substring(0, 10), bedtime: '22:00', wake_time: '06:30', quality: 9, duration: 8.5, notes: 'Fell asleep within minutes. No interruptions. Had pleasant dreams. Woke up feeling refreshed and energized before my alarm.' } },
            { label: 'Nightmare Disrupted', data: { date: new Date().toISOString().substring(0, 10), bedtime: '22:30', wake_time: '06:00', quality: 4, duration: 6, notes: 'Had intense nightmares about being chased. Woke up in a cold sweat at 3am. Took 45 minutes to calm down and fall back asleep. Felt groggy all morning.' } },
            { label: 'Late Night Anxiety', data: { date: new Date().toISOString().substring(0, 10), bedtime: '02:00', wake_time: '07:30', quality: 3, duration: 5.5, notes: 'Could not stop scrolling my phone. Anxiety about finances kept me up. Finally took melatonin at 1am. Sleep was restless and unrefreshing.' } },
          ]} onSelect={(data) => setForm(data)} />
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="form-row">
            <div className="form-group"><label>Bedtime</label><input type="time" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} /></div>
            <div className="form-group"><label>Wake Time</label><input type="time" value={form.wake_time} onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Duration (hours)</label><input type="number" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
            <div className="form-group">
              <label>Quality: {form.quality}/10</label>
              <input type="range" min="1" max="10" value={form.quality} onChange={e => setForm(f => ({ ...f, quality: Number(e.target.value) }))} style={{ accentColor: qualityColor(form.quality) }} />
            </div>
          </div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="How did you sleep?" rows={3} /></div>
        </DetailModal>
      )}
    </div>
  );
}
