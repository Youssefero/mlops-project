import React from 'react';

function PredictionResult({ result }) {
  if (result === null) {
    return (
      <div className="card">
        <h2>💧 Résultat</h2>
        <div className="no-result">
          <p>🌱 Remplis le formulaire et clique sur</p>
          <p><strong>"Prédire le Volume d'eau"</strong></p>
        </div>
      </div>
    );
  }

  const niveau = result < 1 ? '🟢 Faible' : result < 5 ? '🟡 Modéré' : '🔴 Élevé';

  return (
    <div className="card">
      <h2>💧 Résultat de la Prédiction</h2>
      <div className="result-box">
        <div className="result-value">{result.toFixed(2)}</div>
        <div className="result-unit">litres / heure</div>
        <div className="result-label">Besoin en irrigation : {niveau}</div>
      </div>
    </div>
  );
}

export default PredictionResult;