import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import MoodTracker from './pages/MoodTracker'
import JournalPage from './pages/JournalPage'
import ChatPage from './pages/ChatPage'
import MeditationPage from './pages/MeditationPage'
import BreathingPage from './pages/BreathingPage'
import SelfCarePage from './pages/SelfCarePage'
import CopingPage from './pages/CopingPage'
import AssessmentsPage from './pages/AssessmentsPage'
import GoalsPage from './pages/GoalsPage'
import GroupsPage from './pages/GroupsPage'
import CrisisPage from './pages/CrisisPage'
import AffirmationsPage from './pages/AffirmationsPage'
import SleepPage from './pages/SleepPage'
import GratitudePage from './pages/GratitudePage'
import TherapistPage from './pages/TherapistPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AIToolsPage from './pages/AIToolsPage'
import IntegrationsAndCarePage from './pages/IntegrationsAndCarePage'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/moods" element={<ProtectedRoute><MoodTracker /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/meditation" element={<ProtectedRoute><MeditationPage /></ProtectedRoute>} />
          <Route path="/breathing" element={<ProtectedRoute><BreathingPage /></ProtectedRoute>} />
          <Route path="/selfcare" element={<ProtectedRoute><SelfCarePage /></ProtectedRoute>} />
          <Route path="/coping" element={<ProtectedRoute><CopingPage /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
          <Route path="/crisis" element={<ProtectedRoute><CrisisPage /></ProtectedRoute>} />
          <Route path="/affirmations" element={<ProtectedRoute><AffirmationsPage /></ProtectedRoute>} />
          <Route path="/sleep" element={<ProtectedRoute><SleepPage /></ProtectedRoute>} />
          <Route path="/gratitude" element={<ProtectedRoute><GratitudePage /></ProtectedRoute>} />
          <Route path="/therapists" element={<ProtectedRoute><TherapistPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/ai-tools" element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />
          <Route path="/care-integrations" element={<ProtectedRoute><IntegrationsAndCarePage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
