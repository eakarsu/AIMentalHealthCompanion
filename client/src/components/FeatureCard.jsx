import { useNavigate } from 'react-router-dom';

const colorMap = {
  lavender: { bg: 'var(--lavender-light)', icon: 'var(--primary)', border: 'var(--lavender)' },
  mint: { bg: 'var(--mint-light)', icon: '#059669', border: 'var(--mint)' },
  peach: { bg: 'var(--peach-light)', icon: 'var(--accent)', border: 'var(--peach)' },
  sky: { bg: 'var(--sky-light)', icon: '#2563EB', border: 'var(--sky)' },
};

export default function FeatureCard({ icon: Icon, title, description, path, count, color = 'lavender' }) {
  const navigate = useNavigate();
  const c = colorMap[color] || colorMap.lavender;

  return (
    <div
      className="card card-clickable"
      onClick={() => navigate(path)}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: c.bg, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={24} color={c.icon} />
      </div>
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{description}</p>
      </div>
      {count !== undefined && (
        <span className="badge badge-primary" style={{ position: 'absolute', top: 16, right: 16 }}>
          {count}
        </span>
      )}
    </div>
  );
}
