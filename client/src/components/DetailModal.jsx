import { X } from 'lucide-react';

export default function DetailModal({ title, children, onClose, onEdit, onDelete, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
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
        <div className="modal-footer">
          {footer || (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit || onClose}>Edit</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={onDelete || onClose}>Delete</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
