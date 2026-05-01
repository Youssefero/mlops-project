from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

# ✅ Test 1 — Vérifier que /health retourne 200
def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("✅ Test health passé !")

# ✅ Test 2 — Vérifier que /predict retourne un nombre positif
def test_predict_retourne_valeur_positive():
    data = {
        "volume_L": 5.2,
        "heure_sin": 0.5,
        "soil_temperature": 22.3,
        "temperature": 28.5,
        "soil_humidity_roll_3h": 44.0,
        "volume_L_roll_3h": 4.8,
        "volume_lag_1h": 2.3,
        "volume_roll_24h": 18.0,
        "ontario_units": 3.5,
        "co2": 412.0,
        "vpd_kpa": 1.2,
        "pressure": 1013.0,
        "soil_ec": 1.8,
        "volume_lag_48h": 20.0,
        "soil_humidity": 45.2,
        "gdd": 12.5,
        "humidity": 65.0,
        "heure_cos": 0.866,
        "daily_mean_temperature": 25.0,
        "daily_max_reduction": 0.5,
        "standard_day_degree": 8.0,
        "daily_max_above_Tbase": 3.0,
        "daily_max": 32.0,
        "volume_lag_24h": 18.5,
        "was_irrigating_1h": 0.0
    }
    response = client.post("/predict", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["volume_predit_litres"] > 0
    print(f"✅ Test predict passé ! Volume prédit : {result['volume_predit_litres']} L")

# ✅ Test 3 — Vérifier que /predict retourne 422 si données incomplètes
def test_predict_erreur_donnees_incompletes():
    data_incomplete = {
        "temperature": 28.5
        # ← Il manque 24 features !
    }
    response = client.post("/predict", json=data_incomplete)
    assert response.status_code == 422
    print(" Test erreur 422 passé !")