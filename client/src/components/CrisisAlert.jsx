import { Phone, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function CrisisAlert({ resources }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      color: '#fff', padding: '16px 24px',
      boxShadow: '0 4px 16px rgba(220,38,38,0.4)'
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>
            You are not alone. Help is available right now.
          </div>
          <div style={{ fontSize: '0.88rem', opacity: 0.9, marginBottom: '10px' }}>
            If you or someone you know is in crisis, please reach out to one of these resources:
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(resources || []).map((r, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
                padding: '8px 14px', fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Phone size={13} />
                  <span>{r.number}</span>
                </div>
                {r.description && <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>{r.description}</div>}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
          aria-label="Dismiss crisis alert"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
