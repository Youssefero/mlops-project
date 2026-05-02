from fastapi import FastAPI
import pickle
import numpy as np
from pydantic import BaseModel
from prometheus_fastapi_instrumentator import Instrumentator

# Chargement du modèle
model = pickle.load(open("models/best_model.pkl", "rb"))

# Définition de l'application
app = FastAPI(title="Smart Irrigation API")

from fastapi.middleware.cors import CORSMiddleware # Ajouter cet import
# ... après app = FastAPI() ...
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Autorise React à appeler l'API
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Activation du monitoring Prometheus
Instrumentator().instrument(app).expose(app)

# Définition des 25 features
class SensorData(BaseModel):
    volume_L: float
    heure_sin: float
    soil_temperature: float
    temperature: float
    soil_humidity_roll_3h: float
    volume_L_roll_3h: float
    volume_lag_1h: float
    volume_roll_24h: float
    ontario_units: float
    co2: float
    vpd_kpa: float
    pressure: float
    soil_ec: float
    volume_lag_48h: float
    soil_humidity: float
    gdd: float
    humidity: float
    heure_cos: float
    daily_mean_temperature: float
    daily_max_reduction: float
    standard_day_degree: float
    daily_max_above_Tbase: float
    daily_max: float
    volume_lag_24h: float
    was_irrigating_1h: float

# Endpoint 0 — Accueil
@app.get("/")
def home():
    return {"message": "Smart Irrigation API is running!"}

# Endpoint 1 — Santé de l'API
@app.get("/health")
def health():
    return {"status": "ok"}

# Endpoint 2 — Prédiction
@app.post("/predict")
def predict(data: SensorData):
    features = np.array([[
        data.volume_L,
        data.heure_sin,
        data.soil_temperature,
        data.temperature,
        data.soil_humidity_roll_3h,
        data.volume_L_roll_3h,
        data.volume_lag_1h,
        data.volume_roll_24h,
        data.ontario_units,
        data.co2,
        data.vpd_kpa,
        data.pressure,
        data.soil_ec,
        data.volume_lag_48h,
        data.soil_humidity,
        data.gdd,
        data.humidity,
        data.heure_cos,
        data.daily_mean_temperature,
        data.daily_max_reduction,
        data.standard_day_degree,
        data.daily_max_above_Tbase,
        data.daily_max,
        data.volume_lag_24h,
        data.was_irrigating_1h
    ]])

    prediction_log = model.predict(features)[0]
    prediction = float(np.expm1(prediction_log))

    return {"volume_predit_litres": prediction}