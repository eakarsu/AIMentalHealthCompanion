import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { BarChart2, TrendingUp } from 'lucide-react';

const CORRELATION_COLORS = {
  strong: '#22c55e', moderate: '#f59e0b', weak: '#6b7280', none: '#6b7280'
};

export default function AnalyticsPage() {
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/analytics/mood-sleep-correlation');
        setCorrelationData(res.data.data || res.data);
      } catch (e) {
        setError('Failed to load analytics data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  const insight = correlationData?.ai_insight;
  const timeSeries = correlationData?.time_series || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1><BarChart2 size={28} /> Analytics</h1>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem' }}>Mood vs Sleep Correlation (Last 30 Days)</h3>
          {insight?.correlation_strength && (
            <span style={{
              background: `${CORRELATION_COLORS[insight.correlation_strength]}22`,
              color: CORRELATION_COLORS[insight.correlation_strength],
              border: `1px solid ${CORRELATION_COLORS[insight.correlation_strength]}44`,
              padding: '3px 12px', borderRadius: 20, fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize'
            }}>
              {insight.correlation_strength} correlation
            </span>
          )}
        </div>

        {timeSeries.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <BarChart2 size={36} />
            <h3>Not enough data yet</h3>
            <p>Track your mood and sleep for a few days to see correlations.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="mood" domain={[1, 10]} tick={{ fontSize: 11 }} label={{ value: 'Mood', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <YAxis yAxisId="sleep" orientation="right" domain={[0, 12]} tick={{ fontSize: 11 }} label={{ value: 'Sleep (h)', angle: 90, position: 'insideRight', fontSize: 11 }} />
              <Tooltip
                labelFormatter={l => new Date(l).toLocaleDateString()}
                formatter={(v, name) => [name === 'Mood Score' ? `${v}/10` : `${v}h`, name]}
              />
              <Legend />
              <Line yAxisId="mood" type="monotone" dataKey="mood_score" stroke="var(--primary)" strokeWidth={2} name="Mood Score" dot={{ r: 3 }} connectNulls />
              <Line yAxisId="sleep" type="monotone" dataKey="sleep_hours" stroke="#06b6d4" strokeWidth={2} name="Sleep Hours" dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {insight && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--primary)" /> AI Insight
          </h3>
          {insight.key_insight && (
            <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>{insight.key_insight}</p>
          )}
          {insight.pattern_description && (
            <p style={{ color: 'var(--text-light)', marginBottom: 12 }}>{insight.pattern_description}</p>
          )}
          {Array.isArray(insight.recommendations) && insight.recommendations.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Recommendations</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {insight.recommendations.map((r, i) => (
                  <li key={i} style={{ marginBottom: 4, fontSize: '0.9rem', color: 'var(--text-light)' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
