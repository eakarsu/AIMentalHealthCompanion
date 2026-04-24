import { Sparkles } from 'lucide-react';

function parseAIResponse(response) {
  if (!response) return null;
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      return response;
    }
  }
  return response;
}

function renderValue(val, depth = 0) {
  if (val === null || val === undefined) return null;

  if (typeof val === 'string') {
    const paragraphs = val.split('\n').filter(p => p.trim());
    return (
      <div>
        {paragraphs.map((p, i) => {
          if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
            return (
              <div key={i} style={{
                display: 'flex', gap: 8, marginBottom: 6,
                paddingLeft: depth > 0 ? 12 : 0
              }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>&#8226;</span>
                <span>{p.trim().replace(/^[-*]\s*/, '')}</span>
              </div>
            );
          }
          return <p key={i} style={{ marginBottom: 8, lineHeight: 1.7 }}>{p}</p>;
        })}
      </div>
    );
  }

  if (Array.isArray(val)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {val.map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '8px 12px', background: 'rgba(108,99,255,0.04)',
            borderRadius: 8, borderLeft: '3px solid var(--primary-light)'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
            <span style={{ lineHeight: 1.6 }}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (typeof val === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(val).map(([key, v]) => (
          <div key={key} style={{
            padding: 16, background: depth === 0 ? 'var(--bg)' : 'white',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)',
              textTransform: 'capitalize', marginBottom: 6,
              letterSpacing: '0.3px'
            }}>
              {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}
            </div>
            <div style={{ fontSize: '0.92rem' }}>
              {renderValue(v, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(val)}</span>;
}

export default function AIResponseDisplay({ response, title = 'AI Analysis' }) {
  const parsed = parseAIResponse(response);
  if (!parsed) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--lavender-light), var(--sky-light))',
      borderRadius: 'var(--radius)',
      padding: 24,
      border: '1px solid var(--lavender)',
      animation: 'fadeIn 0.5s ease',
      marginTop: 16
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, fontWeight: 600, color: 'var(--primary)'
      }}>
        <Sparkles size={20} />
        {title}
      </div>
      <div style={{ color: 'var(--text)', fontSize: '0.92rem' }}>
        {renderValue(parsed)}
      </div>
    </div>
  );
}
