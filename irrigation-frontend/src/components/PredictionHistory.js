import React from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function PredictionHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="card">
        <h2>📈 Historique des Prédictions</h2>
        <div className="history-empty">
          Aucune prédiction encore — Lance ta première prédiction !
        </div>
      </div>
    );
  }

  const avg = (history.reduce((a, b) => a + b.value, 0) / history.length).toFixed(2);
  const max = Math.max(...history.map(h => h.value)).toFixed(2);
  const total = history.reduce((a, b) => a + b.value, 0).toFixed(2);

  return (
    <div className="card">
      <h2>📈 Historique des Prédictions</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Prédictions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avg}L</div>
          <div className="stat-label">Moyenne</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{total}L</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
          <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: '#1a2332',
              border: '1px solid #2a3a4a',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`${value.toFixed(2)} L`, 'Volume']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: '#4ade80', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PredictionHistory;