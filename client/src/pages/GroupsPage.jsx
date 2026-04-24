import { useState, useEffect } from 'react';
import api from '../api/axios';
import DetailModal from '../components/DetailModal';
import { Users, Plus, Edit, Trash2, ArrowLeft, UserPlus } from 'lucide-react';

export default function GroupsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'anxiety', max_members: 20, meeting_schedule: '', is_private: false });

  const fetchItems = async () => {
    try {
      const res = await api.get('/groups');
      setItems(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing && selected) {
        await api.put(`/groups/${selected.id || selected._id}`, form);
      } else {
        await api.post('/groups', form);
      }
      setShowForm(false); setEditing(false); setSelected(null);
      setForm({ name: '', description: '', category: 'anxiety', max_members: 20, meeting_schedule: '', is_private: false });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this group?')) return;
    try { await api.delete(`/groups/${id}`); setSelected(null); fetchItems(); } catch (e) { console.error(e); }
  };

  const handleJoin = async (id) => {
    try { await api.post(`/groups/${id}/join`); fetchItems(); } catch (e) { console.error(e); }
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '', description: item.description || '',
      category: item.category || 'anxiety', max_members: item.max_members || 20,
      meeting_schedule: item.meeting_schedule || '', is_private: item.is_private || false
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
            <button className="btn btn-success btn-sm" onClick={() => handleJoin(selected.id || selected._id)}><UserPlus size={16} /> Join</button>
            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit size={16} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id || selected._id)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 8 }}>{selected.name}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span className="badge badge-primary">{selected.category}</span>
            <span className="badge badge-info">{selected.members_count || 0} / {selected.max_members} members</span>
            {selected.is_private && <span className="badge badge-warning">Private</span>}
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Description</label><p style={{ whiteSpace: 'pre-wrap' }}>{selected.description || 'No description'}</p></div>
            <div className="detail-field"><label>Meeting Schedule</label><p>{selected.meeting_schedule || 'Not set'}</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Users size={28} /> Support Groups</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', category: 'anxiety', max_members: 20, meeting_schedule: '', is_private: false }); setEditing(false); setShowForm(true); }}>
          <Plus size={18} /> New Group
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><Users size={48} /><h3>No support groups</h3><p>Create or join a support group.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id || item._id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--lavender-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Users size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem' }}>{item.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-lighter)' }}>{item.members_count || 0} members</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 8 }}>
                {(item.description || '').substring(0, 80)}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-primary">{item.category}</span>
                {item.is_private && <span className="badge badge-warning">Private</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DetailModal title={editing ? 'Edit Group' : 'New Support Group'} onClose={() => { setShowForm(false); setEditing(false); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></>}
        >
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Group name" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the group..." rows={3} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['anxiety', 'depression', 'grief', 'addiction', 'ptsd', 'eating_disorders', 'general'].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Max Members</label><input type="number" value={form.max_members} onChange={e => setForm(f => ({ ...f, max_members: Number(e.target.value) }))} /></div>
          </div>
          <div className="form-group"><label>Meeting Schedule</label><input value={form.meeting_schedule} onChange={e => setForm(f => ({ ...f, meeting_schedule: e.target.value }))} placeholder="e.g., Tuesdays at 7 PM" /></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.is_private} onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))} style={{ width: 'auto' }} />
            <label style={{ margin: 0 }}>Private Group</label>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
