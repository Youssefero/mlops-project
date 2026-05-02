import React, { useState } from 'react';
import axios from 'axios';

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

function PredictionForm({ onResult }) {
  const [values, setValues] = useState(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8000/predict', values);
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