import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Phone, Plus, Edit, Trash2, ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';

export default function CrisisPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', description: '', type: 'hotline', available_24_7: true, website: '' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/crisis');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/crisis/${selected.id || selected._id}`, form);
      } else {
        await api.post('/crisis', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ name: '', phone: '', description: '', type: 'hotline', available_24_7: true, website: '' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    try { await api.delete(`/crisis/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '', phone: item.phone || '',
      description: item.description || '', type: item.type || 'hotline',
      available_24_7: item.available_24_7 !== false, website: item.website || ''
    });
    setEditing(true); setSelected(item); setShowForm(true);
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
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'var(--peach-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Phone size={28} color="var(--accent)" />
          </div>
          <h2 style={{ marginBottom: 8 }}>{selected.name}</h2>
          <a href={`tel:${selected.phone}`} style={{
            fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)',
            display: 'block', marginBottom: 8
          }}>
            {selected.phone}
          </a>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            <span className="badge badge-danger">{selected.type}</span>
            {selected.available_24_7 && <span className="badge badge-success">24/7 Available</span>}
          </div>
          <div className="detail-field" style={{ textAlign: 'left' }}>
            <label>Description</label>
            <p style={{ whiteSpace: 'pre-wrap' }}>{selected.description || 'No description'}</p>
          </div>
          {selected.website && (
            <a href={selected.website} target="_blank" rel="noopener" className="btn btn-primary" style={{ marginTop: 16 }}>
              <ExternalLink size={16} /> Visit Website
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{
        background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
        borderRadius: 'var(--radius)', padding: '20px 24px',
        marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        border: '1px solid #FECACA'
      }}>
        <AlertTriangle size={24} color="#DC2626" />
        <div>
          <p style={{ fontWeight: 600, color: '#DC2626' }}>If you are in immediate danger, call 911</p>
          <p style={{ fontSize: '0.85rem', color: '#991B1B' }}>National Suicide Prevention Lifeline: 988</p>
        </div>
      </div>

      <div className="page-header">
        <h1><Phone size={28} /> Crisis Resources</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', phone: '', description: '', type: 'hotline', available_24_7: true, website: '' }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> Add Resource
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Phone size={48} /><h3>No crisis resources</h3><p>Add emergency contacts and helplines.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}
              style={{ borderLeft: '4px solid var(--accent)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{item.name}</h3>
              <a href={`tel:${item.phone}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }} onClick={e => e.stopPropagation()}>
                {item.phone}
              </a>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 6, marginBottom: 8 }}>
                {(item.description || '').substring(0, 80)}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-danger">{item.type}</span>
                {item.available_24_7 && <span className="badge badge-success">24/7</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Resource' : 'Add Crisis Resource'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}
        >
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Resource name" /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" /></div>
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['hotline', 'text_line', 'chat', 'emergency', 'counseling'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the resource..." rows={3} /></div>
          <div className="form-group"><label>Website</label><input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.available_24_7} onChange={e => setForm(f => ({ ...f, available_24_7: e.target.checked }))} style={{ width: 'auto' }} />
            <label style={{ margin: 0 }}>Available 24/7</label>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
