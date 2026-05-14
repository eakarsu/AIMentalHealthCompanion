import { useState } from 'react';
import api from '../api/axios';
import AIResponseDisplay from '../components/AIResponseDisplay';
import CrisisAlert from '../components/CrisisAlert';
import { Sparkles, AlertTriangle, BookOpen, LifeBuoy, Users, Moon, TrendingUp } from 'lucide-react';

const TOOLS = [
  {
    key: 'journal-sentiment',
    label: 'Journal Sentiment',
    icon: BookOpen,
    endpoint: '/ai/journal-sentiment',
    description: 'Analyze sentiment, emotions, and themes from a journal entry; layered with crisis check.',
    fields: [
      { key: 'content', label: 'Journal Entry', type: 'textarea', required: true, placeholder: 'Write or paste your journal entry…' },
      { key: 'context', label: 'Context (optional)', type: 'text', placeholder: 'How are things going generally?' },
    ],
  },
  {
    key: 'crisis-assessment',
    label: 'Crisis Assessment',
    icon: AlertTriangle,
    endpoint: '/ai/crisis-assessment',
    description: 'Risk level, score, warning signs, and escalation flag; merges keyword and model judgement.',
    fields: [
      { key: 'content', label: 'What you are feeling', type: 'textarea', required: true, placeholder: 'Describe what you are experiencing right now' },
      { key: 'recentEvents', label: 'Recent Events (optional)', type: 'textarea' },
    ],
  },
  {
    key: 'coping-recommendation',
    label: 'Coping Recommendation',
    icon: LifeBuoy,
    endpoint: '/ai/coping-recommendation',
    description: 'Personalized coping strategy recommendations from the catalog, with immediate and long-term actions.',
    fields: [
      { key: 'situation', label: 'Situation', type: 'textarea', required: true, placeholder: 'What are you struggling with?' },
      { key: 'mood', label: 'Current Mood', type: 'text', placeholder: 'e.g. anxious, low, overwhelmed' },
      { key: 'preferredStyle', label: 'Preferred Style (optional)', type: 'text', placeholder: 'e.g. CBT, mindfulness, behavioral' },
    ],
  },
  {
    key: 'therapist-match',
    label: 'Therapist Match',
    icon: Users,
    endpoint: '/ai/therapist-match',
    description: 'Match with a therapist based on preferences, modality, and concerns.',
    fields: [
      { key: 'preferences', label: 'Preferences', type: 'textarea', placeholder: 'e.g. female, LGBTQ+ friendly, bilingual' },
      { key: 'concerns', label: 'Concerns', type: 'textarea', required: true, placeholder: 'e.g. anxiety, postpartum, grief' },
      { key: 'modality', label: 'Preferred Modality', type: 'text', placeholder: 'CBT, DBT, ACT, EMDR…' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'City or remote' },
    ],
  },
  {
    key: 'sleep-advisor',
    label: 'Sleep Advisor',
    icon: Moon,
    endpoint: '/ai/sleep-advisor',
    description: 'CBT-I based recommendations from your routine and sleep logs.',
    fields: [
      { key: 'sleep_logs', label: 'Sleep Logs (optional, JSON or text)', type: 'textarea', placeholder: '[{"date":"2026-05-01","bed":"23:30","wake":"07:00","quality":3}]' },
      { key: 'current_routine', label: 'Current Routine', type: 'textarea', placeholder: 'Describe your evening routine and bedroom setup.' },
      { key: 'goals', label: 'Sleep Goals', type: 'text', placeholder: 'e.g. fall asleep within 20 minutes' },
    ],
  },
  {
    key: 'mood-trend-analysis',
    label: 'Mood Trend Analysis',
    icon: TrendingUp,
    endpoint: '/ai/mood-trend-analysis',
    description: 'Spot trends, triggers, and patterns in your mood data.',
    fields: [
      { key: 'mood_logs', label: 'Mood Logs (optional, JSON or text)', type: 'textarea', placeholder: '[{"date":"2026-05-01","mood":"low","score":3}]' },
      { key: 'range_days', label: 'Range (days)', type: 'text', placeholder: '30' },
    ],
  },
];

export default function AIToolsPage() {
  const [activeKey, setActiveKey] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = TOOLS.find(t => t.key === activeKey);

  const setField = (key, value) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {};
      tool.fields.forEach(f => {
        const v = inputs[f.key];
        if (v === undefined || v === '') return;
        payload[f.key] = v;
      });
      const res = await api.post(tool.endpoint, payload);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={22} color="var(--primary)" />
          AI Mental Health Tools
        </h1>
        <p style={{ color: 'var(--text-light)' }}>
          Run specialized AI flows. If a crisis is detected, immediate resources will appear.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        {TOOLS.map(t => {
          const Icon = t.icon;
          const active = t.key === activeKey;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => { setActiveKey(t.key); setInputs({}); setResult(null); setError(null); }}
              className="card"
              style={{
                textAlign: 'left',
                padding: 16,
                border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: active ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon size={20} color="var(--primary)" />
                <strong>{t.label}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{t.description}</div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ maxWidth: 760, padding: 24 }}>
        <h2 style={{ marginBottom: 4 }}>{tool.label}</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>{tool.description}</p>

        <form onSubmit={handleSubmit}>
          {tool.fields.map(field => (
            <div key={field.key} className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">{field.label}{field.required ? ' *' : ''}</label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={5}
                  required={field.required}
                  className="form-input"
                  value={inputs[field.key] || ''}
                  onChange={e => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  className="form-input"
                  value={inputs[field.key] || ''}
                  onChange={e => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Running…' : `Run ${tool.label}`}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 6 }}>
            {String(error)}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            {(result.crisisDetected || result.escalation_recommended) && (
              <CrisisAlert resources={result.crisisResources || result.resources} />
            )}
            <AIResponseDisplay
              response={typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              title={tool.label}
            />
          </div>
        )}
      </div>
    </div>
  );
}
