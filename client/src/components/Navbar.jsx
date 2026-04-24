import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem'
        }}>
          <Brain size={28} color="var(--primary)" />
          <span>MindWell</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {location.pathname !== '/' && (
            <Link to="/" className="btn btn-secondary btn-sm">
              <Home size={16} /> Dashboard
            </Link>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 14px', background: 'var(--bg)', borderRadius: 20,
            fontSize: '0.88rem', color: 'var(--text-light)'
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 600, fontSize: '0.8rem'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {user?.name || 'User'}
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Logout">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
