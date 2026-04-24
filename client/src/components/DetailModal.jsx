import { X } from 'lucide-react';

export default function DetailModal({ title, children, onClose, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg)', borderRadius: 8, padding: 6,
            display: 'flex', alignItems: 'center'
          }}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
