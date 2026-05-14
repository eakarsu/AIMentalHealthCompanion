import { useState } from 'react';
import api from '../api/axios';

const INTEGRATIONS = [
  { key: 'twilio', label: 'Crisis SMS (Twilio)', endpoint: '/integrations/sms/twilio', body: { to: '+15555550100', message: 'Crisis check-in' } },
  { key: 'healthkit', label: 'Apple HealthKit Import', endpoint: '/integrations/healthkit/import', body: {} },
  { key: 'fitbit', label: 'Fitbit Import', endpoint: '/integrations/fitbit/import', body: {} },
  { key: 'voice', label: 'Voice Therapy (Deepgram)', endpoint: '/integrations/voice/transcribe', body: {} },
  { key: 'zoom', label: 'Video Therapy (Zoom)', endpoint: '/integrations/zoom/session', body: {} },
];

export default function IntegrationsAndCarePage() {
  const [tab, setTab] = useState('integrations');
  return (
    <div style={{ padding: 24 }}>
      <h2>Care Integrations & Tools</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['integrations', 'medication', 'network', 'export', 'messages', 'anomaly'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 12px',
              border: '1px solid #6366f1',
              background: tab === t ? '#6366f1' : '#fff',
              color: tab === t ? 'white' : '#6366f1',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'medication' && <MedicationTab />}
      {tab === 'network' && <NetworkTab />}
      {tab === 'export' && <ExportTab />}
      {tab === 'messages' && <MessagesTab />}
      {tab === 'anomaly' && <AnomalyTab />}
    </div>
  );
}

function IntegrationsTab() {
  const [results, setResults] = useState({});
  const test = async (i) => {
    try {
      const r = await api.post(i.endpoint, i.body);
      setResults((s) => ({ ...s, [i.key]: { status: r.status, data: r.data } }));
    } catch (e) {
      setResults((s) => ({ ...s, [i.key]: { status: e.response?.status, data: e.response?.data || { error: e.message } } }));
    }
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
      {INTEGRATIONS.map((i) => {
        const r = results[i.key];
        return (
          <div key={i.key} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{i.label}</div>
            <button onClick={() => test(i)} style={{ marginTop: 6, padding: '4px 10px' }}>Test</button>
            {r && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                {r.status === 503 ? (
                  <div style={{ background: '#fff8e1', border: '1px solid #ffb74d', padding: 8, borderRadius: 4 }}>
                    <div>Configure {i.label}</div>
                    <div>Missing: <code>{r.data?.missing}</code></div>
                  </div>
                ) : (
                  <pre style={{ background: '#f5f5f5', padding: 6, borderRadius: 4, overflow: 'auto' }}>{JSON.stringify(r.data, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MedicationTab() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const load = async () => {
    try {
      const r = await api.get('/medications');
      setList(r.data.medications || []);
    } catch {
      setList([]);
    }
  };
  const add = async () => {
    if (!name) return;
    await api.post('/medications', { name, dosage });
    setName('');
    setDosage('');
    load();
  };
  return (
    <div>
      <button onClick={load} style={{ padding: '4px 10px' }}>Load</button>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} />
        <button onClick={add} style={{ padding: '4px 10px' }}>Add</button>
      </div>
      <ul style={{ marginTop: 12 }}>
        {list.map((m) => (
          <li key={m.id}>{m.name} {m.dosage ? `(${m.dosage})` : ''}</li>
        ))}
      </ul>
    </div>
  );
}

function NetworkTab() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const load = async () => {
    try {
      const r = await api.get('/network');
      setList(r.data.contacts || []);
    } catch {
      setList([]);
    }
  };
  const add = async () => {
    if (!name) return;
    await api.post('/network', { name, relationship });
    setName('');
    setRelationship('');
    load();
  };
  return (
    <div>
      <button onClick={load} style={{ padding: '4px 10px' }}>Load</button>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
        <button onClick={add} style={{ padding: '4px 10px' }}>Add</button>
      </div>
      <ul style={{ marginTop: 12 }}>
        {list.map((c) => (
          <li key={c.id}>{c.name} — {c.relationship} (scopes: {c.scopes})</li>
        ))}
      </ul>
    </div>
  );
}

function ExportTab() {
  const [out, setOut] = useState(null);
  const run = async () => {
    try {
      const r = await api.get('/export/me');
      setOut(r.data);
    } catch (e) {
      setOut({ error: e.response?.data?.error || e.message });
    }
  };
  return (
    <div>
      <button onClick={run} style={{ padding: '4px 10px' }}>Generate Bundle</button>
      {out && <pre style={{ background: '#f5f5f5', padding: 8, marginTop: 12, borderRadius: 4, maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}

function MessagesTab() {
  const [body, setBody] = useState('Checking in.');
  const [list, setList] = useState([]);
  const send = async () => {
    await api.post('/secure-messages', { body });
    setBody('');
    load();
  };
  const load = async () => {
    const r = await api.get('/secure-messages');
    setList(r.data.messages || []);
  };
  return (
    <div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ width: '100%' }} />
      <div>
        <button onClick={send} style={{ padding: '4px 10px' }}>Send (encrypted)</button>
        <button onClick={load} style={{ padding: '4px 10px', marginLeft: 8 }}>Load</button>
      </div>
      <ul style={{ marginTop: 12 }}>
        {list.map((m) => (
          <li key={m.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: '#666' }}>{m.sender_role} — {new Date(m.created_at).toLocaleString()}</div>
            <div>{m.body}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnomalyTab() {
  const [out, setOut] = useState(null);
  const run = async () => {
    try {
      const r = await api.get('/anomaly/moods');
      setOut(r.data);
    } catch (e) {
      setOut({ error: e.response?.data?.error || e.message });
    }
  };
  return (
    <div>
      <button onClick={run} style={{ padding: '4px 10px' }}>Detect mood anomalies</button>
      {out && <pre style={{ background: '#f5f5f5', padding: 8, marginTop: 12, borderRadius: 4 }}>{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}
