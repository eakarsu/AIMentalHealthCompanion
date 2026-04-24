import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Zap, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = () => {
    setEmail('demo@mentalhealth.com');
    setPassword('password123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #6B8DD6 60%, #8E37D7 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 40,
        width: '100%', maxWidth: 420, boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.5s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Brain size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Welcome to MindWell</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.92rem' }}>
            Your AI-powered mental health companion
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626', padding: '10px 14px',
            borderRadius: 8, marginBottom: 16, fontSize: '0.88rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-lighter)'
              }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-lighter)'
              }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? <div className="spinner" style={{ borderTopColor: 'white' }}></div> : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 20, paddingTop: 20,
          borderTop: '1px solid var(--border-light)', textAlign: 'center'
        }}>
          <button onClick={quickLogin} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <Zap size={18} /> Quick Demo Login
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-lighter)', marginTop: 12 }}>
            Click "Quick Demo Login" to auto-fill credentials, then sign in
          </p>
        </div>
      </div>
    </div>
  );
}
