"""
training_pipeline.py
====================
Pipeline ZenML complet pour le projet d'irrigation intelligente.

ZenML connecte les étapes entre elles et garantit :
- La reproductibilité (même résultat à chaque run)
- Le tracking automatique (qui a tourné quoi, quand, avec quelles données)
- La détection des changements (si les données changent → re-run automatique)

Pour lancer :
    python pipelines/training_pipeline.py
"""

import pandas as pd
import numpy as np
import pickle
import mlflow
from pathlib import Path
from typing import Tuple, Annotated

# ZenML imports
from zenml import step, pipeline
from zenml.client import Client


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Ingestion des données
# ─────────────────────────────────────────────────────────────────────────────

@step
def ingest_data() -> Tuple[
    Annotated[pd.DataFrame, "train"],
    Annotated[pd.DataFrame, "val"],
    Annotated[pd.DataFrame, "test"],
]:
    """
    Charge les splits déjà générés par le preprocessing.
    Si tu utilises DVC + DagHub, les fichiers sont déjà synchronisés.
    
    ZenML va :
    - Sauvegarder ces DataFrames comme artefacts
    - Calculer leur hash pour détecter les changements
    - Ne PAS re-exécuter les étapes suivantes si les données n'ont pas changé
    """
    features_dir = Path("data/features")

    train = pd.read_csv(features_dir / "train.csv")
    val   = pd.read_csv(features_dir / "val.csv")
    test  = pd.read_csv(features_dir / "test.csv")

    print(f"[ingest] Train={train.shape} | Val={val.shape} | Test={test.shape}")
    return train, val, test


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Préparation X / y
# ─────────────────────────────────────────────────────────────────────────────

@step
def prepare_features(
    train: pd.DataFrame,
    val:   pd.DataFrame,
    test:  pd.DataFrame,
) -> Tuple[
    Annotated[pd.DataFrame, "X_train"],
    Annotated[pd.DataFrame, "X_val"],
    Annotated[pd.DataFrame, "X_test"],
    Annotated[pd.Series,    "y_train"],
    Annotated[pd.Series,    "y_val"],
    Annotated[pd.Series,    "y_test"],
]:
    """
    Sépare les features (X) de la cible (y).
    ZenML sauvegarde chaque output comme un artefact versionné.
    """
    TARGET = "target_volume_L"
    DROP   = ["target_volume_L", "line"]

    X_train = train.drop(columns=DROP)
    y_train = train[TARGET]
    X_val   = val.drop(columns=DROP)
    y_val   = val[TARGET]
    X_test  = test.drop(columns=DROP)
    y_test  = test[TARGET]

    print(f"[prepare] Features : {X_train.shape[1]} colonnes")
    print(f"[prepare] Cible : min={y_train.min():.1f} | mean={y_train.mean():.1f} | max={y_train.max():.1f} L")

    return X_train, X_val, X_test, y_train, y_val, y_test


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3a — Entraîner Random Forest
# ─────────────────────────────────────────────────────────────────────────────

@step(experiment_tracker="mlflow_tracker")
def train_random_forest_step(
    X_train: pd.DataFrame,
    X_val:   pd.DataFrame,
    X_test:  pd.DataFrame,
    y_train: pd.Series,
    y_val:   pd.Series,
    y_test:  pd.Series,
) -> Annotated[dict, "rf_metrics"]:
    """
    Entraîne Random Forest et retourne les métriques.
    Le décorateur @step(experiment_tracker="mlflow_tracker") 
    connecte automatiquement ZenML à MLflow.
    """
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    model = RandomForestRegressor(
        n_estimators=200, max_depth=10,
        min_samples_leaf=4, n_jobs=-1, random_state=42,
    )
    model.fit(X_train, y_train)

    test_pred = model.predict(X_test)
    metrics = {
        "model":      "RandomForest",
        "test_mae":   float(mean_absolute_error(y_test, test_pred)),
        "test_rmse":  float(np.sqrt(mean_squared_error(y_test, test_pred))),
        "test_r2":    float(r2_score(y_test, test_pred)),
    }

    mlflow.log_metrics({k: v for k, v in metrics.items() if k != "model"})
    mlflow.sklearn.log_model(model, "random_forest")

    # Sauvegarde locale
    Path("models").mkdir(exist_ok=True)
    with open("models/random_forest.pkl", "wb") as f:
        pickle.dump(model, f)

    print(f"[RF] MAE={metrics['test_mae']:.2f}L  R²={metrics['test_r2']:.3f}")
    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3b — Entraîner XGBoost
# ─────────────────────────────────────────────────────────────────────────────

@step(experiment_tracker="mlflow_tracker")
def train_xgboost_step(
    X_train: pd.DataFrame,
    X_val:   pd.DataFrame,
    X_test:  pd.DataFrame,
    y_train: pd.Series,
    y_val:   pd.Series,
    y_test:  pd.Series,
) -> Annotated[dict, "xgb_metrics"]:
    """Entraîne XGBoost avec early stopping."""
    import xgboost as xgb
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    model = xgb.XGBRegressor(
        n_estimators=500, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, min_child_weight=3,
        reg_alpha=0.1, reg_lambda=1.0, random_state=42,
        early_stopping_rounds=30, verbosity=0,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    test_pred = model.predict(X_test)
    metrics = {
        "model":          "XGBoost",
        "test_mae":       float(mean_absolute_error(y_test, test_pred)),
        "test_rmse":      float(np.sqrt(mean_squared_error(y_test, test_pred))),
        "test_r2":        float(r2_score(y_test, test_pred)),
        "best_iteration": int(model.best_iteration),
    }

    mlflow.log_metrics({k: v for k, v in metrics.items() if k != "model"})
    mlflow.sklearn.log_model(model, "xgboost")

    with open("models/xgboost.pkl", "wb") as f:
        pickle.dump(model, f)

    print(f"[XGB] MAE={metrics['test_mae']:.2f}L  R²={metrics['test_r2']:.3f}  best_iter={metrics['best_iteration']}")
    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Sélectionner le meilleur modèle
# ─────────────────────────────────────────────────────────────────────────────

@step
def select_best_model_step(
    rf_metrics:  dict,
    xgb_metrics: dict,
) -> Annotated[str, "best_model_name"]:
    """
    Compare RF et XGBoost, retourne le nom du meilleur.
    Ce step peut être étendu pour inclure LSTM.
    
    ZenML sauvegarde cette décision comme artefact :
    tu peux retrouver quel modèle a été choisi pour chaque run.
    """
    import shutil

    candidates = [rf_metrics, xgb_metrics]
    best = min(candidates, key=lambda m: m["test_mae"])
    best_name = best["model"]

    print("\n" + "="*45)
    print("COMPARAISON FINALE")
    print("="*45)
    for m in candidates:
        marker = " ← MEILLEUR" if m["model"] == best_name else ""
        print(f"  {m['model']:<15} MAE={m['test_mae']:.2f}L  R²={m['test_r2']:.3f}{marker}")
    print(f"\nMeilleur modèle : {best_name}")

    # Copier le meilleur comme best_model.pkl
    src = Path("models") / f"{best_name.lower()}.pkl"
    dst = Path("models") / "best_model.pkl"
    if src.exists():
        shutil.copy(src, dst)
        print(f"Sauvegardé → models/best_model.pkl")

    return best_name


# ─────────────────────────────────────────────────────────────────────────────
# PIPELINE PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────

@pipeline(name="irrigation_training_pipeline")
def training_pipeline():
    """
    Pipeline ZenML complet.
    
    ZenML gère automatiquement :
    - L'ordre d'exécution des steps
    - Le passage des données entre steps
    - Le versioning de chaque artefact
    - Le lien avec MLflow pour le tracking
    """
    # Step 1 : charger les données
    train, val, test = ingest_data()

    # Step 2 : préparer X/y
    X_train, X_val, X_test, y_train, y_val, y_test = prepare_features(
        train, val, test
    )

    # Step 3 : entraîner les modèles EN PARALLÈLE
    # (ZenML lance les steps indépendants en même temps)
    rf_metrics  = train_random_forest_step(X_train, X_val, X_test, y_train, y_val, y_test)
    xgb_metrics = train_xgboost_step(X_train, X_val, X_test, y_train, y_val, y_test)

    # Step 4 : choisir le meilleur
    best_model = select_best_model_step(rf_metrics, xgb_metrics)


# ─────────────────────────────────────────────────────────────────────────────
# LANCEMENT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Initialiser ZenML (une seule fois)
    # zenml init  (dans le terminal)

    # Lancer le pipeline
    training_pipeline()
    

    print("\nPipeline terminé !")
    print("Pour voir les runs ZenML : zenml pipeline runs list")
    print("Pour voir MLflow        : mlflow ui")
