import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Brain, SmilePlus, BookOpen, MessageCircle, Flower2, Wind,
  Heart, Shield, ClipboardCheck, Target, Users,
  Phone, Sun, Moon, Sparkles, Stethoscope, LogOut, Home,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { section: 'Wellness Tools' },
  { icon: SmilePlus, label: 'Mood Tracker', path: '/moods' },
  { icon: BookOpen, label: 'Journal', path: '/journal' },
  { icon: MessageCircle, label: 'AI Therapy Chat', path: '/chat' },
  { icon: Moon, label: 'Sleep Tracker', path: '/sleep' },
  { section: 'Mindfulness' },
  { icon: Flower2, label: 'Meditation', path: '/meditation' },
  { icon: Wind, label: 'Breathing', path: '/breathing' },
  { icon: Sparkles, label: 'Gratitude Log', path: '/gratitude' },
  { icon: Sun, label: 'Affirmations', path: '/affirmations' },
  { section: 'Growth' },
  { icon: Heart, label: 'Self-Care', path: '/selfcare' },
  { icon: Shield, label: 'Coping Strategies', path: '/coping' },
  { icon: Target, label: 'Goals', path: '/goals' },
  { icon: ClipboardCheck, label: 'Assessments', path: '/assessments' },
  { section: 'Support' },
  { icon: Users, label: 'Support Groups', path: '/groups' },
  { icon: Phone, label: 'Crisis Resources', path: '/crisis' },
  { icon: Stethoscope, label: 'Find Therapist', path: '/therapists' },
  { section: 'Insights' },
  { icon: Brain, label: 'Analytics', path: '/analytics' },
  { icon: Sparkles, label: 'AI Tools', path: '/ai-tools' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Brain size={26} />
        </div>
        {!collapsed && <span className="sidebar-brand-text">MindWell</span>}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User profile */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'User'}</span>
            <span className="sidebar-user-role">Member</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return !collapsed ? (
              <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <div key={i} className="sidebar-divider" />
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-link sidebar-logout" onClick={handleLogout} title="Logout">
          <LogOut size={19} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
