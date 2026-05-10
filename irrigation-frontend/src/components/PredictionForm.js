import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

const defaultValues = {
  volume_L: 5.2,
  heure_sin: 0.5,
  soil_temperature: 22.3,
  temperature: 28.5,
  soil_humidity_roll_3h: 44.0,
  volume_L_roll_3h: 4.8,
  volume_lag_1h: 2.3,
  volume_roll_24h: 18.0,
  ontario_units: 3.5,
  co2: 412.0,
  vpd_kpa: 1.2,
  pressure: 1013.0,
  soil_ec: 1.8,
  volume_lag_48h: 20.0,
  soil_humidity: 45.2,
  gdd: 12.5,
  humidity: 65.0,
  heure_cos: 0.866,
  daily_mean_temperature: 25.0,
  daily_max_reduction: 0.5,
  standard_day_degree: 8.0,
  daily_max_above_Tbase: 3.0,
  daily_max: 32.0,
  volume_lag_24h: 18.5,
  was_irrigating_1h: 0.0,
};

const labels = {
  volume_L: 'Volume (L)',
  heure_sin: 'Heure Sin',
  soil_temperature: 'Temp. Sol (°C)',
  temperature: 'Température (°C)',
  soil_humidity_roll_3h: 'Humidité Sol 3h',
  volume_L_roll_3h: 'Volume Roll 3h',
  volume_lag_1h: 'Volume Lag 1h',
  volume_roll_24h: 'Volume Roll 24h',
  ontario_units: 'Ontario Units',
  co2: 'CO₂ (ppm)',
  vpd_kpa: 'VPD (kPa)',
  pressure: 'Pression (hPa)',
  soil_ec: 'EC Sol',
  volume_lag_48h: 'Volume Lag 48h',
  soil_humidity: 'Humidité Sol (%)',
  gdd: 'GDD',
  humidity: 'Humidité Air (%)',
  heure_cos: 'Heure Cos',
  daily_mean_temperature: 'Temp. Moyenne',
  daily_max_reduction: 'Max Réduction',
  standard_day_degree: 'Degrés Jour',
  daily_max_above_Tbase: 'Max > Tbase',
  daily_max: 'Temp. Max (°C)',
  volume_lag_24h: 'Volume Lag 24h',
  was_irrigating_1h: 'Irriguait (0/1)',
};

const explanations = {
  volume_L: "Volume d'eau actuel dans le système (Litres).",
  heure_sin: "Transformation mathématique (Sinus) de l'heure pour le modèle (Cyclicité).",
  soil_temperature: "Température actuelle du sol mesurée par les capteurs SMTC.",
  temperature: "Température de l'air environnant.",
  soil_humidity_roll_3h: "Moyenne de l'humidité du sol sur les 3 dernières heures.",
  volume_L_roll_3h: "Moyenne du volume d'eau utilisé sur les 3 dernières heures.",
  volume_lag_1h: "Volume d'eau qui a été mesuré il y a exactement 1 heure.",
  volume_roll_24h: "Moyenne du volume d'eau utilisé sur les dernières 24 heures.",
  ontario_units: "Indicateur agronomique basé sur la température pour évaluer la croissance.",
  co2: "Niveau de Dioxyde de Carbone dans l'air (ppm).",
  vpd_kpa: "Déficit de Pression de Vapeur (kPa). Plus il est haut, plus la plante \"transpire\".",
  pressure: "Pression atmosphérique (hPa).",
  soil_ec: "Conductivité Électrique du sol (indique le niveau de salinité/nutriments).",
  volume_lag_48h: "Volume d'eau mesuré il y a 48 heures.",
  soil_humidity: "Humidité actuelle du sol (%).",
  gdd: "Degrés Jours de Croissance (Growing Degree Days). Mesure l'accumulation de chaleur.",
  humidity: "Humidité relative de l'air (%).",
  heure_cos: "Transformation mathématique (Cosinus) de l'heure actuelle.",
  daily_mean_temperature: "Température moyenne journalière.",
  daily_max_reduction: "Indicateur calculé de réduction de la température.",
  standard_day_degree: "Indicateur de degrés-jours standard pour la culture.",
  daily_max_above_Tbase: "Température maximale au-dessus de la température de base.",
  daily_max: "Température maximale atteinte dans la journée.",
  volume_lag_24h: "Volume d'eau mesuré il y a 24 heures.",
  was_irrigating_1h: "Indique si le système était en train d'irriguer il y a 1 heure (1 = Oui, 0 = Non).",
};

function PredictionForm({ onResult }) {
  const [values, setValues] = useState(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/predict`, values);
      onResult(response.data.volume_predit_litres);
    } catch (err) {
      setError("❌ Erreur : Vérifiez que l'API est démarrée sur le port 8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>🎛️ Données Capteurs</h2>
      <div className="grid-3">
        {Object.keys(defaultValues).map(key => (
          <div className="form-group" key={key}>
            <label>{labels[key]}</label>
            <input
              type="number"
              step="any"
              value={values[key]}
              onChange={e => handleChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      
      <div className="info-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <button 
          className="btn-secondary" 
          onClick={() => setShowInfo(!showInfo)}
          style={{ 
            backgroundColor: '#e0f2f1', 
            color: '#00695c', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <span>ℹ️ Comprendre les champs à remplir</span>
          <span>{showInfo ? '▲' : '▼'}</span>
        </button>
        
        {showInfo && (
          <div className="info-box" style={{ 
            backgroundColor: '#f1f8e9', 
            padding: '15px', 
            borderRadius: '0 0 5px 5px',
            border: '1px solid #c5e1a5',
            borderTop: 'none',
            fontSize: '0.9em',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {Object.keys(explanations).map(key => (
                <li key={key} style={{ marginBottom: '8px' }}>
                  <strong>{labels[key]} :</strong> {explanations[key]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}
      <button
        className="btn-predict"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? '⏳ Calcul en cours...' : '💧 Prédire le Volume d\'eau'}
      </button>
    </div>
  );
}

export default PredictionForm;