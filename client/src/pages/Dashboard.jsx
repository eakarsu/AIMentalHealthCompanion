import { useAuth } from '../context/AuthContext';
import FeatureCard from '../components/FeatureCard';
import {
  SmilePlus, BookOpen, MessageCircle, Flower2, Wind,
  Heart, Shield, ClipboardCheck, Target, Users,
  Phone, Sun, Moon, Sparkles, Stethoscope, BarChart2
} from 'lucide-react';

const features = [
  { icon: SmilePlus, title: 'Mood Tracker', description: 'Track your daily moods and emotional patterns', path: '/moods', color: 'lavender' },
  { icon: BookOpen, title: 'Journal', description: 'Write and reflect with AI-powered insights', path: '/journal', color: 'mint' },
  { icon: MessageCircle, title: 'AI Therapy Chat', description: 'Talk with your AI mental health companion', path: '/chat', color: 'sky' },
  { icon: Flower2, title: 'Meditation', description: 'Guided meditation sessions for mindfulness', path: '/meditation', color: 'mint' },
  { icon: Wind, title: 'Breathing Exercises', description: 'Calm your mind with guided breathing', path: '/breathing', color: 'sky' },
  { icon: Heart, title: 'Self-Care', description: 'Discover and track self-care activities', path: '/selfcare', color: 'peach' },
  { icon: Shield, title: 'Coping Strategies', description: 'Learn effective coping techniques', path: '/coping', color: 'lavender' },
  { icon: ClipboardCheck, title: 'Assessments', description: 'PHQ-9, GAD-7, and WHO-5 assessments', path: '/assessments', color: 'sky' },
  { icon: Target, title: 'Goals', description: 'Set and track mental health goals', path: '/goals', color: 'mint' },
  { icon: Users, title: 'Support Groups', description: 'Connect with community support', path: '/groups', color: 'lavender' },
  { icon: Phone, title: 'Crisis Resources', description: 'Emergency contacts and helplines', path: '/crisis', color: 'peach' },
  { icon: Sun, title: 'Affirmations', description: 'Daily positive affirmations', path: '/affirmations', color: 'peach' },
  { icon: Moon, title: 'Sleep Tracker', description: 'Monitor your sleep patterns', path: '/sleep', color: 'sky' },
  { icon: Sparkles, title: 'Gratitude Log', description: 'Record things you are grateful for', path: '/gratitude', color: 'mint' },
  { icon: Stethoscope, title: 'Therapist Directory', description: 'Find professional therapists', path: '/therapists', color: 'lavender' },
  { icon: BarChart2, title: 'Analytics', description: 'Mood & sleep correlation insights', path: '/analytics', color: 'sky' },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div style={{
        background: 'linear-gradient(135deg, var(--lavender-light), var(--sky-light), var(--mint-light))',
        borderRadius: 'var(--radius-lg)', padding: '32px 36px',
        marginBottom: 32, border: '1px solid var(--lavender)'
      }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>
          Welcome back, {user?.name || 'Friend'}
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
          How are you feeling today? Explore your wellness tools below.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 20
      }}>
        {features.map(f => (
          <FeatureCard key={f.path} {...f} />
        ))}
      </div>
    </div>
  );
}
