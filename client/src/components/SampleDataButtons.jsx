import { Zap } from 'lucide-react';

export default function SampleDataButtons({ samples, onSelect, label = 'Try a sample scenario:' }) {
  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
      padding: '12px 16px', marginBottom: 16,
      border: '1px dashed var(--border)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 10, fontSize: '0.8rem', fontWeight: 600,
        color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        <Zap size={14} />
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {samples.map((sample, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(sample.data)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.8rem', borderStyle: 'dashed' }}
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
