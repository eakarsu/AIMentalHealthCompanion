import { useState } from 'react';
import api from '../api/axios';
import AIResponseDisplay from '../components/AIResponseDisplay';
import SampleDataButtons from '../components/SampleDataButtons';
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

const EXAMPLES = {
  'journal-sentiment': [
    ['Work transition', { content: 'I started a new role this week. I felt nervous before the team meeting, but I was proud that I asked a question and received helpful feedback.', context: 'First week in a new job; looking for patterns in anxiety and confidence.' }],
    ['Family visit', { content: 'I enjoyed seeing my sister today. I also noticed I felt drained after a long conversation and needed a quiet walk afterward.', context: 'Balancing family connection with rest and personal boundaries.' }],
    ['Small progress', { content: 'I slept better last night and finished one task I had avoided. I still worry about tomorrow, but today felt manageable.', context: 'Tracking gradual progress during a stressful month.' }],
  ],
  'crisis-assessment': [
    ['Overwhelmed at work', { content: 'I feel overwhelmed and anxious after several deadlines, and I would like help deciding what support to ask for.', recentEvents: 'A project deadline moved earlier; I have been sleeping less this week.' }],
    ['Recent loss', { content: 'I feel sad and disconnected after a loss. I want help understanding when to reach out for more support.', recentEvents: 'A close family member died recently; I spoke with a friend yesterday.' }],
    ['Panic symptoms', { content: 'I had a panic episode this morning and feel frightened that it could happen again.', recentEvents: 'A crowded commute and a difficult meeting happened today.' }],
  ],
  'coping-recommendation': [
    ['Meeting anxiety', { situation: 'I am nervous about presenting at a team meeting tomorrow and keep rehearsing mistakes.', mood: 'anxious', preferredStyle: 'CBT and grounding' }],
    ['Evening stress', { situation: 'After work I keep checking messages and struggle to wind down before bed.', mood: 'tense and tired', preferredStyle: 'mindfulness and a short routine' }],
    ['Social overwhelm', { situation: 'I want to attend a small gathering but worry that I will feel overwhelmed.', mood: 'uncertain', preferredStyle: 'gentle behavioral steps' }],
  ],
  'therapist-match': [
    ['Anxiety support', { preferences: 'Trauma-informed and collaborative approach', concerns: 'Work anxiety and recurring worry', modality: 'CBT', location: 'Remote appointments in New York' }],
    ['Grief counseling', { preferences: 'Evening appointments and a supportive style', concerns: 'Grief after a family loss', modality: 'Grief counseling', location: 'Boston or remote' }],
    ['Relationship support', { preferences: 'LGBTQ+ affirming and sliding scale if available', concerns: 'Relationship stress and communication', modality: 'ACT', location: 'Chicago or remote' }],
  ],
  'sleep-advisor': [
    ['Shifted bedtime', { sleep_logs: '[{"day":"Monday","bed":"00:30","wake":"07:00","quality":3},{"day":"Tuesday","bed":"00:15","wake":"07:10","quality":3}]', current_routine: 'I check my phone in bed and drink coffee in the late afternoon.', goals: 'Move bedtime earlier and wake more rested.' }],
    ['Night waking', { sleep_logs: '[{"day":"Monday","bed":"22:45","wake":"06:30","quality":2},{"day":"Tuesday","bed":"23:00","wake":"06:30","quality":2}]', current_routine: 'I wake around 3 a.m. and start planning the next day.', goals: 'Reduce time awake during the night.' }],
    ['Weekend schedule', { sleep_logs: '[{"day":"Friday","bed":"23:30","wake":"07:30","quality":4},{"day":"Saturday","bed":"01:30","wake":"10:00","quality":3}]', current_routine: 'My weekends have a much later sleep schedule than weekdays.', goals: 'Build a more consistent sleep schedule.' }],
  ],
  'mood-trend-analysis': [
    ['Weekly check-in', { mood_logs: '[{"day":"Monday","mood":"calm","score":7},{"day":"Tuesday","mood":"anxious","score":4},{"day":"Wednesday","mood":"steady","score":6}]', range_days: '7' }],
    ['Work pattern', { mood_logs: '[{"day":"Monday","mood":"tense","score":4},{"day":"Wednesday","mood":"tired","score":5},{"day":"Saturday","mood":"relaxed","score":8}]', range_days: '14' }],
    ['Month review', { mood_logs: '[{"week":1,"mood":"low","score":4},{"week":2,"mood":"steady","score":6},{"week":3,"mood":"hopeful","score":7}]', range_days: '30' }],
  ],
};

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
          <SampleDataButtons samples={EXAMPLES[tool.key].map(([label, data]) => ({ label, data }))} onSelect={(data) => { setInputs(data); setResult(null); setError(null); }} />
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
              response={result}
              title={tool.label}
            />
          </div>
        )}
      </div>
    </div>
  );
}
