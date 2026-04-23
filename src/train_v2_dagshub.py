"""
train_v2.py — VERSION FINALE avec DagHub + MLflow
===================================================
Repo DagHub : https://dagshub.com/zidane.remix000/mlops-project

Toutes les corrections appliquées :
  1. log1p sur la cible  (93% de zéros → distribution déséquilibrée)
  2. Features lag 1h/24h/48h (mémoire du planning d'irrigation)
  3. Sélection top-25 features (supprimer le bruit des 90 colonnes)
  4. LSTM corrigé (séquence 24h, BatchNorm, loss Huber)
  5. sample_weight=13 pour XGBoost (équilibrer les 6.8% d'irrigations)

Chaque run est automatiquement visible sur :
  https://dagshub.com/zidane.remix000/mlops-project/experiments
"""

import os
import numpy as np
import pandas as pd
import pickle
import mlflow
import mlflow.sklearn
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import warnings
warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────────────────────────────────────
# CONNEXION DAGSHUB + MLFLOW
# ─────────────────────────────────────────────────────────────────────────────

def setup_mlflow():
    """
    Connecte MLflow à DagHub.
    Les runs apparaîtront sur :
    https://dagshub.com/zidane.remix000/mlops-project/experiments
    """
    try:
        import dagshub
        dagshub.init(
            repo_owner="zidane.remix000",
            repo_name="mlops-project",
            mlflow=True
        )
        print("MLflow connecté à DagHub ✓")
        print("Suivi des runs : https://dagshub.com/zidane.remix000/mlops-project/experiments")

    except ImportError:
        # Fallback si dagshub n'est pas installé
        print("dagshub non trouvé → installation en cours...")
        os.system("pip install dagshub -q")
        import dagshub
        dagshub.init(
            repo_owner="zidane.remix000",
            repo_name="mlops-project",
            mlflow=True
        )

    mlflow.set_experiment("irrigation-intelligente-v2")


# ─────────────────────────────────────────────────────────────────────────────
# 1. CHARGEMENT + CORRECTIONS DES FEATURES
# ─────────────────────────────────────────────────────────────────────────────

def load_splits(features_dir: Path = Path("data/features")):
    """
    Charge les splits train/val/test et applique toutes les corrections.
    Compatible avec :
      - preprocessing_pas_a_pas.ipynb  → colonne 'volume_L'
      - preprocessing.py               → colonne 'volume_consumed_L'
    """
    print("\n" + "="*55)
    print("CHARGEMENT DES DONNÉES")
    print("="*55)

    train = pd.read_csv(features_dir / "train.csv")
    val   = pd.read_csv(features_dir / "val.csv")
    test  = pd.read_csv(features_dir / "test.csv")

    # ── Détecter la colonne volume ────────────────────────────────────────────
    full = pd.concat([train, val, test], ignore_index=True)

    if 'volume_consumed_L' in full.columns:
        vol_col = 'volume_consumed_L'
    elif 'volume_L' in full.columns:
        vol_col = 'volume_L'
    else:
        candidates = [c for c in full.columns
                      if 'volume' in c.lower()
                      and 'target' not in c.lower()
                      and 'roll' not in c.lower()
                      and 'm3' not in c.lower()
                      and 'lag' not in c.lower()]
        if not candidates:
            raise KeyError(
                f"Aucune colonne volume trouvée.\n"
                f"Colonnes disponibles : {list(full.columns)}"
            )
        vol_col = candidates[0]

    print(f"  Colonne volume détectée : '{vol_col}'")

    # ── Ajouter colonne line si absente ───────────────────────────────────────
    if 'line' not in full.columns:
        full['line'] = 0

    # ── CORRECTION 1 : features lag ──────────────────────────────────────────
    # Le volume passé est la feature la plus prédictive (importance ~0.45)
    # car l'irrigation suit un planning horaire régulier
    for lag, name in [(1, 'lag_1h'), (24, 'lag_24h'), (48, 'lag_48h')]:
        full[f'volume_{name}'] = (
            full.groupby('line')[vol_col]
            .shift(lag)
            .fillna(0)
        )

    # Moyenne glissante sur 24h
    full['volume_roll_24h'] = (
        full.groupby('line')[vol_col]
        .transform(lambda x: x.rolling(24, min_periods=1).mean())
    )

    # Indicateur binaire : "irrigait-on l'heure d'avant ?"
    full['was_irrigating_1h'] = (full['volume_lag_1h'] > 0).astype(int)

    # ── Recouper les splits ───────────────────────────────────────────────────
    n_train = len(train)
    n_val   = len(val)
    train = full.iloc[:n_train].copy()
    val   = full.iloc[n_train:n_train + n_val].copy()
    test  = full.iloc[n_train + n_val:].copy()

    TARGET = "target_volume_L"
    DROP   = ["target_volume_L", "line"]

    X_train = train.drop(columns=[c for c in DROP if c in train.columns])
    X_val   = val.drop(columns=[c for c in DROP if c in val.columns])
    X_test  = test.drop(columns=[c for c in DROP if c in test.columns])
    y_train = train[TARGET]
    y_val   = val[TARGET]
    y_test  = test[TARGET]

    # ── CORRECTION 2 : log1p sur la cible ────────────────────────────────────
    # 93% de zéros → les modèles prédisent toujours 0 sans cette transformation
    # log1p(0)=0, log1p(91)≈4.5 → distribution équilibrée
    y_train_log = np.log1p(y_train)
    y_val_log   = np.log1p(y_val)

    # ── CORRECTION 3 : poids sample_weight ───────────────────────────────────
    # Les 368 heures d'irrigation (6.8%) reçoivent 13x plus de poids
    weights = np.where(y_train > 0, 13.0, 1.0)

    print(f"  Train={X_train.shape} | Val={X_val.shape} | Test={X_test.shape}")
    print(f"  Features lag ajoutées : lag_1h, lag_24h, lag_48h, roll_24h, was_irrigating_1h")
    print(f"  Zéros dans train : {(y_train==0).sum()}/{len(y_train)} ({(y_train==0).mean()*100:.0f}%)")

    return (X_train, X_val, X_test,
            y_train, y_val, y_test,
            y_train_log, y_val_log, weights)


def select_top_features(X_train, y_train_log, X_val, X_test, n=25):
    """
    CORRECTION 4 : sélectionner les N features les plus importantes.
    Réduit 90+ colonnes → 25, supprime le bruit, améliore la généralisation.
    """
    print(f"\nSélection des {n} meilleures features sur {X_train.shape[1]} total...")

    selector = RandomForestRegressor(
        n_estimators=50, max_depth=8,
        n_jobs=-1, random_state=42
    )
    selector.fit(X_train, y_train_log)

    importances = pd.Series(
        selector.feature_importances_,
        index=X_train.columns
    ).sort_values(ascending=False)

    top_features = importances.head(n).index.tolist()

    print("Top 10 features :")
    for i, (feat, imp) in enumerate(importances.head(10).items(), 1):
        print(f"  {i:2}. {feat:<35} {imp:.4f}")

    return X_train[top_features], X_val[top_features], X_test[top_features], top_features


# ─────────────────────────────────────────────────────────────────────────────
# UTILITAIRES
# ─────────────────────────────────────────────────────────────────────────────

def compute_metrics(y_true, y_pred, label=""):
    """Calcule MAE, RMSE, R² en litres réels (pas en log)."""
    y_pred = np.maximum(y_pred, 0)
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    print(f"  {label:<6} → MAE={mae:.2f}L  RMSE={rmse:.2f}L  R²={r2:.3f}")
    return {"mae": mae, "rmse": rmse, "r2": r2}


def save_model(obj, name, models_dir=Path("models")):
    models_dir.mkdir(exist_ok=True)
    path = models_dir / f"{name}.pkl"
    with open(path, "wb") as f:
        pickle.dump(obj, f)
    print(f"  Sauvegardé → {path}")
    return path


# ─────────────────────────────────────────────────────────────────────────────
# MODÈLE 1 — RANDOM FOREST
# ─────────────────────────────────────────────────────────────────────────────

def train_random_forest(X_train, X_val, X_test,
                        y_train, y_val, y_test,
                        y_train_log, weights):
    print("\n" + "="*55)
    print("MODÈLE 1 — Random Forest")
    print("="*55)

    with mlflow.start_run(run_name="RandomForest_v2"):

        # Logguer les tags pour identifier ce run sur DagHub
        mlflow.set_tags({
            "model_type":   "RandomForest",
            "dataset":      "stuard_irrigation",
            "corrections":  "log1p+lag+weights+top25",
            "author":       "zidane.remix000",
        })

        params = {
            "n_estimators":     300,
            "max_depth":        12,
            "min_samples_leaf": 2,
            "n_jobs":           -1,
            "random_state":     42,
            "log1p_target":     True,
            "sample_weight":    True,
            "n_features":       X_train.shape[1],
        }
        mlflow.log_params(params)

        model = RandomForestRegressor(
            n_estimators=300,
            max_depth=12,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=42,
        )
        model.fit(X_train, y_train_log, sample_weight=weights)

        # Prédictions → retour en litres avec expm1
        val_pred  = np.expm1(model.predict(X_val))
        test_pred = np.expm1(model.predict(X_test))

        val_metrics  = compute_metrics(y_val,  val_pred,  "Val  ")
        test_metrics = compute_metrics(y_test, test_pred, "Test ")

        mlflow.log_metrics({
            "val_mae":   val_metrics["mae"],
            "val_rmse":  val_metrics["rmse"],
            "val_r2":    val_metrics["r2"],
            "test_mae":  test_metrics["mae"],
            "test_rmse": test_metrics["rmse"],
            "test_r2":   test_metrics["r2"],
        })

        # Logguer le modèle (visible dans DagHub Artifacts)
        mlflow.sklearn.log_model(
            model,
            artifact_path="random_forest_model",
            registered_model_name="irrigation-random-forest",
        )
        save_model(model, "random_forest")

        run_id = mlflow.active_run().info.run_id
        print(f"  MLflow run_id : {run_id}")

    return model, test_metrics


# ─────────────────────────────────────────────────────────────────────────────
# MODÈLE 2 — XGBOOST
# ─────────────────────────────────────────────────────────────────────────────

def train_xgboost(X_train, X_val, X_test,
                  y_train, y_val, y_test,
                  y_train_log, y_val_log, weights):
    print("\n" + "="*55)
    print("MODÈLE 2 — XGBoost")
    print("="*55)

    with mlflow.start_run(run_name="XGBoost_v2"):

        mlflow.set_tags({
            "model_type":  "XGBoost",
            "dataset":     "stuard_irrigation",
            "corrections": "log1p+lag+weights+early_stopping+top25",
            "author":      "zidane.remix000",
        })

        params = {
            "n_estimators":     600,
            "max_depth":        5,
            "learning_rate":    0.03,
            "subsample":        0.8,
            "colsample_bytree": 0.7,
            "min_child_weight": 1,
            "reg_alpha":        0.05,
            "reg_lambda":       1.5,
            "random_state":     42,
            "early_stopping":   40,
            "log1p_target":     True,
            "sample_weight":    True,
            "n_features":       X_train.shape[1],
        }
        mlflow.log_params(params)

        model = xgb.XGBRegressor(
            n_estimators=600,
            max_depth=5,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.7,
            min_child_weight=1,
            reg_alpha=0.05,
            reg_lambda=1.5,
            random_state=42,
            early_stopping_rounds=40,
            verbosity=0,
            n_jobs=-1,
        )
        model.fit(
            X_train, y_train_log,
            sample_weight=weights,
            eval_set=[(X_val, y_val_log)],
            verbose=False,
        )

        print(f"  Meilleur nombre d'arbres : {model.best_iteration}")

        val_pred  = np.expm1(model.predict(X_val))
        test_pred = np.expm1(model.predict(X_test))

        val_metrics  = compute_metrics(y_val,  val_pred,  "Val  ")
        test_metrics = compute_metrics(y_test, test_pred, "Test ")

        mlflow.log_metrics({
            "val_mae":        val_metrics["mae"],
            "val_rmse":       val_metrics["rmse"],
            "val_r2":         val_metrics["r2"],
            "test_mae":       test_metrics["mae"],
            "test_rmse":      test_metrics["rmse"],
            "test_r2":        test_metrics["r2"],
            "best_iteration": model.best_iteration,
        })

        mlflow.sklearn.log_model(
            model,
            artifact_path="xgboost_model",
            registered_model_name="irrigation-xgboost",
        )
        save_model(model, "xgboost")

        run_id = mlflow.active_run().info.run_id
        print(f"  MLflow run_id : {run_id}")

    return model, test_metrics


# ─────────────────────────────────────────────────────────────────────────────
# MODÈLE 3 — LSTM
# ─────────────────────────────────────────────────────────────────────────────

def train_lstm(X_train, X_val, X_test,
               y_train, y_val, y_test,
               y_train_log, y_val_log,
               sequence_len: int = 24):
    print("\n" + "="*55)
    print("MODÈLE 3 — LSTM")
    print("="*55)

    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import (LSTM, Dense, Dropout,
                                             Input, BatchNormalization)
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        from tensorflow.keras.optimizers import Adam
    except ImportError:
        print("  TensorFlow non installé → skip LSTM")
        print("  Lance : pip install tensorflow")
        return None, None

    # Normalisation obligatoire pour les réseaux de neurones
    scaler_X  = StandardScaler()
    X_train_s = scaler_X.fit_transform(X_train)
    X_val_s   = scaler_X.transform(X_val)
    X_test_s  = scaler_X.transform(X_test)

    y_train_arr = y_train_log.values
    y_val_arr   = y_val_log.values

    def make_sequences(X, y, seq_len):
        Xs, ys = [], []
        for i in range(seq_len, len(X)):
            Xs.append(X[i - seq_len:i])
            ys.append(y[i])
        return array(Xs), np.array(ys)

    X_tr_seq, y_tr_seq = make_sequences(X_train_s, y_train_arr, sequence_len)
    X_vl_seq, y_vl_seq = make_sequences(X_val_s,   y_val_arr,   sequence_len)

    n_features = X_train_s.shape[1]
    print(f"  Séquences train={X_tr_seq.shape} | val={X_vl_seq.shape}")

    with mlflow.start_run(run_name="LSTM_v2"):

        mlflow.set_tags({
            "model_type":  "LSTM",
            "dataset":     "stuard_irrigation",
            "corrections": "log1p+seq24h+batchnorm+huber",
            "author":      "zidane.remix000",
        })

        params = {
            "sequence_len":  sequence_len,
            "lstm_units_1":  64,
            "lstm_units_2":  32,
            "dropout":       0.3,
            "learning_rate": 0.001,
            "batch_size":    64,
            "max_epochs":    150,
            "loss":          "huber",
            "log1p_target":  True,
            "n_features":    n_features,
        }
        mlflow.log_params(params)

        model = Sequential([
            Input(shape=(sequence_len, n_features)),
            LSTM(64, return_sequences=True),
            BatchNormalization(),
            Dropout(0.3),
            LSTM(32, return_sequences=False),
            BatchNormalization(),
            Dropout(0.3),
            Dense(16, activation="relu"),
            Dense(1,  activation="relu"),   # relu → pas de valeur négative
        ])

        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss="huber",   # moins sensible aux outliers que MSE
        )

        early_stop = EarlyStopping(
            monitor="val_loss", patience=20,
            restore_best_weights=True, verbose=0
        )
        reduce_lr = ReduceLROnPlateau(
            monitor="val_loss", factor=0.5,
            patience=8, min_lr=1e-6, verbose=0
        )

        history = model.fit(
            X_tr_seq, y_tr_seq,
            validation_data=(X_vl_seq, y_vl_seq),
            epochs=150,
            batch_size=64,
            callbacks=[early_stop, reduce_lr],
            verbose=1,
        )

        epochs_run = len(history.history["loss"])
        print(f"  Arrêté à l'époque {epochs_run}")

        # Prédictions test
        X_te_seq, _ = make_sequences(X_test_s, np.zeros(len(X_test_s)), sequence_len)
        y_test_trim  = y_test.values[sequence_len:]
        test_pred    = np.expm1(model.predict(X_te_seq, verbose=0).ravel())

        test_metrics = compute_metrics(y_test_trim, test_pred, "Test ")

        mlflow.log_metrics({
            "test_mae":       test_metrics["mae"],
            "test_rmse":      test_metrics["rmse"],
            "test_r2":        test_metrics["r2"],
            "epochs_run":     epochs_run,
            "val_loss_final": float(history.history["val_loss"][-1]),
        })

        # Sauvegarder le bundle complet (modèle + scaler nécessaire pour servir)
        bundle = {
            "model_config":  model.to_json(),
            "model_weights": model.get_weights(),
            "scaler_X":      scaler_X,
            "sequence_len":  sequence_len,
        }
        save_model(bundle, "lstm_bundle")

        run_id = mlflow.active_run().info.run_id
        print(f"  MLflow run_id : {run_id}")

    return model, test_metrics


# ─────────────────────────────────────────────────────────────────────────────
# COMPARAISON ET SÉLECTION DU MEILLEUR MODÈLE
# ─────────────────────────────────────────────────────────────────────────────

def select_best_model(results: dict):
    print("\n" + "="*55)
    print("COMPARAISON FINALE")
    print("="*55)
    print(f"\n{'Modèle':<20} {'MAE (L)':<12} {'RMSE (L)':<12} {'R²'}")
    print("-" * 55)

    best_name, best_mae = None, float("inf")
    for name, m in results.items():
        if m is None:
            continue
        marker = " ← MEILLEUR" if m["mae"] < best_mae else ""
        print(f"{name:<20} {m['mae']:<12.2f} {m['rmse']:<12.2f} {m['r2']:.3f}{marker}")
        if m["mae"] < best_mae:
            best_mae, best_name = m["mae"], name

    print(f"\nMeilleur modèle : {best_name} (MAE = {best_mae:.2f} L/heure)")

    # Copier le meilleur modèle comme best_model.pkl
    import shutil
    key_map = {
        "RandomForest": "random_forest",
        "XGBoost":      "xgboost",
        "LSTM":         "lstm_bundle",
    }
    src = Path("models") / f"{key_map.get(best_name, best_name.lower())}.pkl"
    dst = Path("models") / "best_model.pkl"
    if src.exists():
        shutil.copy(src, dst)
        print(f"Sauvegardé → models/best_model.pkl")

    # Logguer le meilleur modèle dans un run MLflow dédié
    with mlflow.start_run(run_name="BEST_MODEL_SUMMARY"):
        mlflow.set_tags({"best_model": best_name, "author": "zidane.remix000"})
        mlflow.log_params({"best_model_name": best_name})
        mlflow.log_metrics({
            "best_mae":  best_mae,
            "best_rmse": results[best_name]["rmse"],
            "best_r2":   results[best_name]["r2"],
        })
        if dst.exists():
            mlflow.log_artifact(str(dst), artifact_path="best_model")

    return best_name


# ─────────────────────────────────────────────────────────────────────────────
# POINT D'ENTRÉE
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    # ── 1. Connexion DagHub + MLflow ──────────────────────────────────────────
    setup_mlflow()

    # ── 2. Chargement + corrections ───────────────────────────────────────────
    (X_train, X_val, X_test,
     y_train, y_val, y_test,
     y_train_log, y_val_log, weights) = load_splits()

    # ── 3. Sélection top-25 features ──────────────────────────────────────────
    X_train, X_val, X_test, top_features = select_top_features(
        X_train, y_train_log, X_val, X_test, n=25
    )

    # ── 4. Entraînement des 3 modèles ─────────────────────────────────────────
    _, rf_metrics = train_random_forest(
        X_train, X_val, X_test,
        y_train, y_val, y_test,
        y_train_log, weights
    )
    _, xgb_metrics = train_xgboost(
        X_train, X_val, X_test,
        y_train, y_val, y_test,
        y_train_log, y_val_log, weights
    )
    _, lstm_metrics = train_lstm(
        X_train, X_val, X_test,
        y_train, y_val, y_test,
        y_train_log, y_val_log,
        sequence_len=24
    )

    # ── 5. Sélection du meilleur ───────────────────────────────────────────────
    results = {
        "RandomForest": rf_metrics,
        "XGBoost":      xgb_metrics,
        "LSTM":         lstm_metrics,
    }
    best = select_best_model(results)

    print("\n" + "="*55)
    print("TERMINÉ !")
    print("="*55)
    print(f"  Meilleur modèle : {best}")
    print(f"  Fichier         : models/best_model.pkl")
    print(f"  Voir les runs   : https://dagshub.com/zidane.remix000/mlops-project/experiments")
    print("="*55)