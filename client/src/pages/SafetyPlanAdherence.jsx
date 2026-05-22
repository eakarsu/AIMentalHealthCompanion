import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const splitLines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean)

function SafetyPlanAdherence() {
  const [form, setForm] = useState({
    planName: 'Evening support plan',
    warningSigns: 'Skipping meals\nIsolating after work\nRacing thoughts',
    copingSteps: 'Breathing exercise\nText support contact\nMove to shared room',
    supportContacts: 'Jordan\nTherapist office',
    environmentRisks: 'Medication not locked\nBeing alone late at night',
    completedSteps: 'Breathing exercise\nText support contact',
    moodTrend: 'declining',
    crisisSignal: false,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const checkPlan = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await axios.post(`${API_URL}/safety-plan-adherence/check`, {
        planName: form.planName,
        warningSigns: splitLines(form.warningSigns),
        copingSteps: splitLines(form.copingSteps),
        supportContacts: splitLines(form.supportContacts),
        environmentRisks: splitLines(form.environmentRisks),
        completedSteps: splitLines(form.completedSteps),
        moodTrend: form.moodTrend,
        crisisSignal: form.crisisSignal,
      })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to check safety plan adherence')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Safety Plan Adherence Check</h1>
        <p>Review whether safety plan steps are complete and identify remaining care-plan gaps.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <form className="card" onSubmit={checkPlan}>
          <div className="form-group">
            <label>Plan name</label>
            <input value={form.planName} onChange={(e) => update('planName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Warning signs, one per line</label>
            <textarea rows="4" value={form.warningSigns} onChange={(e) => update('warningSigns', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Coping steps, one per line</label>
            <textarea rows="4" value={form.copingSteps} onChange={(e) => update('copingSteps', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Support contacts, one per line</label>
            <textarea rows="3" value={form.supportContacts} onChange={(e) => update('supportContacts', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Environment risks, one per line</label>
            <textarea rows="3" value={form.environmentRisks} onChange={(e) => update('environmentRisks', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Completed steps, one per line</label>
            <textarea rows="3" value={form.completedSteps} onChange={(e) => update('completedSteps', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mood trend</label>
            <select value={form.moodTrend} onChange={(e) => update('moodTrend', e.target.value)}>
              <option value="improving">Improving</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input type="checkbox" checked={form.crisisSignal} onChange={(e) => update('crisisSignal', e.target.checked)} style={{ width: 'auto' }} />
            <span>Crisis signal present</span>
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check plan'}</button>
          {error && <div style={{ marginTop: 16, color: '#DC2626' }}>{error}</div>}
        </form>

        <section className="card">
          <h2>Adherence output</h2>
          {!result ? (
            <p style={{ color: 'var(--text-light)', marginTop: 12 }}>Run the check to see adherence score, risk band, gaps, and next actions.</p>
          ) : (
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 34, fontWeight: 700 }}>{result.adherenceScore}%</span>
                  <span style={{ color: 'var(--text-light)' }}> adherence</span>
                </div>
                <span className={`badge ${result.riskBand === 'urgent' ? 'badge-danger' : result.riskBand === 'elevated' ? 'badge-warning' : 'badge-success'}`}>{result.riskBand}</span>
              </div>
              <p>{result.completedCount} of {result.totalChecklistItems} plan items completed.</p>
              <h3>Gaps</h3>
              <ul>{result.gaps.map((gap) => <li key={`${gap.type}-${gap.item}`}>{gap.type}: {gap.item}</li>)}</ul>
              <h3>Next actions</h3>
              <ul>{result.nextActions.map((action) => <li key={action}>{action}</li>)}</ul>
              <p style={{ color: 'var(--text-light)' }}>{result.disclaimer}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default SafetyPlanAdherence
