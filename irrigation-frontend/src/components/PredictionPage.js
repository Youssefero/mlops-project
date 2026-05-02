import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const IconDrop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconSend    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconHistory = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.87L1 10"/></svg>;
const IconSlider  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>;

/* ── Default sensor values (realistic from STUARD dataset) ─────────────────── */
const DEFAULT = {
  volume_L:               5.2,
  heure_sin:              0.5,
  soil_temperature:      22.3,
  temperature:           28.5,
  soil_humidity_roll_3h: 44.0,
  volume_L_roll_3h:       4.8,
  volume_lag_1h:          2.3,
  volume_roll_24h:       18.0,
  ontario_units:          3.5,
  co2:                  412.0,
  vpd_kpa:                1.2,
  pressure:            1013.0,
  soil_ec:                1.8,
  volume_lag_48h:        20.0,
  soil_humidity:         45.2,
  gdd:                   12.5,
  humidity:              65.0,
  heure_cos:              0.866,
  daily_mean_temperature: 25.0,
  daily_max_reduction:    0.5,
  standard_day_degree:    8.0,
  daily_max_above_Tbase:  3.0,
  daily_max:             32.0,
  volume_lag_24h:        18.5,
  was_irrigating_1h:      0.0,
};

const LABELS = {
  volume_L:               'Volume actuel (L)',
  heure_sin:              'Heure Sin',
  soil_temperature:       'Température sol (°C)',
  temperature:            'Température air (°C)',
  soil_humidity_roll_3h:  'Humidité sol 3h',
  volume_L_roll_3h:       'Volume roll 3h',
  volume_lag_1h:          'Volume lag 1h',
  volume_roll_24h:        'Volume roll 24h',
  ontario_units:          'Ontario units',
  co2:                    'CO₂ (ppm)',
  vpd_kpa:                'VPD (kPa)',
  pressure:               'Pression (hPa)',
  soil_ec:                'EC sol (µS/cm)',
  volume_lag_48h:         'Volume lag 48h',
  soil_humidity:          'Humidité sol (%)',
  gdd:                    'GDD',
  humidity:               'Humidité air (%)',
  heure_cos:              'Heure Cos',
  daily_mean_temperature: 'Temp. moyenne',
  daily_max_reduction:    'Max réduction',
  standard_day_degree:    'Degrés jour',
  daily_max_above_Tbase:  'Max > Tbase',
  daily_max:              'Temp. max (°C)',
  volume_lag_24h:         'Volume lag 24h',
  was_irrigating_1h:      'Irriguait (0/1)',
};

/* ── Custom Tooltip ────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#fff',border:'1px solid #e0e0e0',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{fontWeight:600,marginBottom:4,color:'#333'}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color}}>{p.name}: <strong>{p.value?.toFixed(2)} L</strong></div>
      ))}
    </div>
  );
};

/* ── Prediction Form ───────────────────────────────────────────────────────── */
function PredictionForm({ onResult }) {
  const [values, setValues]   = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (key, val) =>
    setValues(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_URL}/predict`, values);
      onResult(res.data.volume_predit_litres);
    } catch {
      setError("Impossible de joindre l'API. Vérifiez qu'elle tourne sur le port 8000.");
    } finally { setLoading(false); }
  };

  return (
    <div className="card">
      <div className="card-title"><IconSlider /> Paramètres des capteurs</div>
      <div className="grid-3">
        {Object.keys(DEFAULT).map(key => (
          <div className="form-group" key={key}>
            <label>{LABELS[key]}</label>
            <input
              type="number" step="any"
              value={values[key]}
              onChange={e => handleChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      {error && (
        <div className="error-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
      <button className="btn-predict" onClick={handleSubmit} disabled={loading}>
        {loading ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18,animation:'spin 1s linear infinite'}}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Calcul en cours...
          </>
        ) : (
          <><IconSend /> Prédire le volume d'eau</>
        )}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Result Panel ──────────────────────────────────────────────────────────── */
function ResultPanel({ result }) {
  if (result === null) {
    return (
      <div className="card" style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div className="card-title"><IconDrop /> Résultat</div>
        <div className="no-result">
          <IconDrop />
          <p>Lance une prédiction pour voir<br/>le volume d'eau estimé</p>
        </div>
      </div>
    );
  }

  const niveau  = result < 1 ? 'Faible' : result < 5 ? 'Modéré' : 'Élevé';
  const nEmoji  = result < 1 ? '🟢' : result < 5 ? '🟡' : '🔴';

  return (
    <div className="card">
      <div className="card-title"><IconDrop /> Résultat de la prédiction</div>
      <div className="result-hero">
        <div style={{fontSize:'0.8rem',opacity:0.7,marginBottom:8,textTransform:'uppercase',letterSpacing:'1px'}}>Volume prédit</div>
        <div className="result-number">{result.toFixed(2)}</div>
        <div className="result-unit">litres / heure</div>
        <div className="result-badge">
          {nEmoji} Besoin : <strong>{niveau}</strong>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}}>
        {[
          ['Débit estimé', `${(result/60).toFixed(3)} L/min`],
          ['Par 24h',      `${(result*24).toFixed(1)} L/jour`],
        ].map(([label, val]) => (
          <div key={label} style={{background:'#f5f4f0',borderRadius:8,padding:'10px 14px'}}>
            <div style={{fontSize:'0.72rem',color:'#a8a090',fontWeight:500}}>{label}</div>
            <div style={{fontSize:'1rem',fontWeight:700,color:'#1a1a18',fontFamily:'DM Mono,monospace',marginTop:2}}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── History Panel ─────────────────────────────────────────────────────────── */
function HistoryPanel({ history }) {
  if (history.length === 0) {
    return (
      <div className="card">
        <div className="card-title"><IconHistory /> Historique</div>
        <div className="history-empty">Aucune prédiction pour l'instant</div>
      </div>
    );
  }

  const avg   = (history.reduce((a,b) => a + b.value, 0) / history.length).toFixed(2);
  const total = history.reduce((a,b) => a + b.value, 0).toFixed(1);
  const avgLine = parseFloat(avg);

  return (
    <div className="card">
      <div className="card-title"><IconHistory /> Historique des prédictions</div>
      <div className="history-stats">
        {[
          ['Prédictions', history.length],
          ['Moyenne',     `${avg} L`],
          ['Total',       `${total} L`],
        ].map(([lbl, val]) => (
          <div className="history-stat" key={lbl}>
            <div className="history-stat-val">{val}</div>
            <div className="history-stat-lbl">{lbl}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
          <XAxis dataKey="time" stroke="#a8a090" fontSize={11} />
          <YAxis stroke="#a8a090" fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avgLine} stroke="#2196f3" strokeDasharray="4 4" strokeWidth={1.5} />
          <Line
            type="monotone" dataKey="value" name="Volume"
            stroke="#2e7d32" strokeWidth={2.5}
            dot={{ fill:'#2e7d32', r:4, strokeWidth:0 }}
            activeDot={{ r:6, fill:'#1565c0' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function PredictionPage({ result, history, onResult }) {
  return (
    <>
      <div className="page-header">
        <h1>Prédiction d'irrigation</h1>
        <p>Entrez les valeurs des capteurs pour prédire le volume d'eau nécessaire</p>
      </div>

      <div className="grid-2 mb-24">
        <ResultPanel result={result} />
        <HistoryPanel history={history} />
      </div>

      <PredictionForm onResult={onResult} />
    </>
  );
}
