"""
train.py
========
Entraînement de 3 modèles pour la prédiction d'irrigation.
- Modèle 1 : Random Forest
- Modèle 2 : XGBoost
- Modèle 3 : LSTM (réseau de neurones temporel)

Chaque modèle est tracké automatiquement dans MLflow.
"""

import numpy as np
import pandas as pd
import pickle
import mlflow
import mlflow.sklearn
import mlflow.keras
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import warnings
warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────────────────────────────────────
# UTILITAIRES
# ─────────────────────────────────────────────────────────────────────────────

def load_splits(features_dir: Path = Path("data/features")):
    """Charge les 3 splits (train / val / test) générés par preprocessing."""
    train = pd.read_csv(features_dir / "train.csv")
    val   = pd.read_csv(features_dir / "val.csv")
    test  = pd.read_csv(features_dir / "test.csv")

    TARGET = "target_volume_L"
    DROP   = ["target_volume_L", "line"]

    X_train, y_train = train.drop(columns=DROP), train[TARGET]
    X_val,   y_val   = val.drop(columns=DROP),   val[TARGET]
    X_test,  y_test  = test.drop(columns=DROP),  test[TARGET]

    print(f"Train : {X_train.shape} | Val : {X_val.shape} | Test : {X_test.shape}")
    return X_train, X_val, X_test, y_train, y_val, y_test


def compute_metrics(y_true, y_pred, label=""):
    """Calcule MAE, RMSE, R² et les affiche."""
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    print(f"  {label} → MAE={mae:.2f}L  RMSE={rmse:.2f}L  R²={r2:.3f}")
    return {"mae": mae, "rmse": rmse, "r2": r2}


def save_model(model, name: str, models_dir: Path = Path("models")):
    """Sauvegarde le modèle en .pkl."""
    models_dir.mkdir(exist_ok=True)
    path = models_dir / f"{name}.pkl"
    with open(path, "wb") as f:
        pickle.dump(model, f)
    print(f"  Modèle sauvegardé → {path}")
    return path


# ─────────────────────────────────────────────────────────────────────────────
# MODÈLE 1 — RANDOM FOREST
# ─────────────────────────────────────────────────────────────────────────────

def train_random_forest(X_train, X_val, X_test, y_train, y_val, y_test):
    """
    Random Forest : un ensemble de 200 arbres de décision.
    
    Pourquoi ?
    - Robuste, pas besoin de normaliser les données
    - Donne l'importance des features (quelle feature influence le plus l'irrigation ?)
    - Bon résultat de base sans trop régler
    """
    print("\n" + "="*50)
    print("MODÈLE 1 — Random Forest")
    print("="*50)

    with mlflow.start_run(run_name="RandomForest"):

        # Hyperparamètres
        params = {
            "n_estimators": 200,      # 200 arbres
            "max_depth": 10,           # profondeur max de chaque arbre
            "min_samples_leaf": 4,     # min 4 exemples par feuille (évite l'overfitting)
            "n_jobs": -1,              # utiliser tous les CPU
            "random_state": 42,
        }
        mlflow.log_params(params)

        # Entraînement
        model = RandomForestRegressor(**params)
        model.fit(X_train, y_train)

        # Évaluation
        val_pred  = model.predict(X_val)
        test_pred = model.predict(X_test)

        val_metrics  = compute_metrics(y_val,  val_pred,  "Val ")
        test_metrics = compute_metrics(y_test, test_pred, "Test")

        # Log métriques dans MLflow
        mlflow.log_metrics({
            "val_mae":   val_metrics["mae"],
            "val_rmse":  val_metrics["rmse"],
            "val_r2":    val_metrics["r2"],
            "test_mae":  test_metrics["mae"],
            "test_rmse": test_metrics["rmse"],
            "test_r2":   test_metrics["r2"],
        })

        # Log modèle dans MLflow
        mlflow.sklearn.log_model(model, "random_forest_model")

        # Top 10 features les plus importantes
        feat_importance = pd.Series(
            model.feature_importances_,
            index=X_train.columns
        ).sort_values(ascending=False)

        print("\n  Top 10 features importantes :")
        print(feat_importance.head(10).round(4).to_string())

        # Sauvegarder localement
        save_model(model, "random_forest")

        run_id = mlflow.active_run().info.run_id
        print(f"  MLflow run_id : {run_id}")

    return model, test_metrics


# ─────────────────────────────────────────────────────────────────────────────
# MODÈLE 2 — XGBOOST
# ─────────────────────────────────────────────────────────────────────────────

def train_xgboost(X_train, X_val, X_test, y_train, y_val, y_test):
    """
    XGBoost : arbres boostés par gradient.
    
    Pourquoi ?
    - Souvent plus précis que Random Forest sur les données tabulaires
    - Gère bien les valeurs manquantes
    - Entraînement rapide même sur de nombreuses features
    - Early stopping : s'arrête automatiquement quand la val ne s'améliore plus
    """
    print("\n" + "="*50)
    print("MODÈLE 2 — XGBoost")
    print("="*50)

    with mlflow.start_run(run_name="XGBoost"):

        params = {
            "n_estimators":     500,
            "max_depth":        6,
            "learning_rate":    0.05,    # petit lr = apprentissage lent mais stable
            "subsample":        0.8,     # 80% des données par arbre (évite overfitting)
            "colsample_bytree": 0.8,     # 80% des features par arbre
            "min_child_weight": 3,
            "reg_alpha":        0.1,     # régularisation L1
            "reg_lambda":       1.0,     # régularisation L2
            "random_state":     42,
            "n_jobs":           -1,
        }
        mlflow.log_params(params)

        model = xgb.XGBRegressor(**params, early_stopping_rounds=30, verbosity=0)

        # early_stopping utilise la val pour s'arrêter au bon moment
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

        print(f"  Meilleur nombre d'arbres : {model.best_iteration}")

        val_pred  = model.predict(X_val)
        test_pred = model.predict(X_test)

        val_metrics  = compute_metrics(y_val,  val_pred,  "Val ")
        test_metrics = compute_metrics(y_test, test_pred, "Test")

        mlflow.log_metrics({
            "val_mae":         val_metrics["mae"],
            "val_rmse":        val_metrics["rmse"],
            "val_r2":          val_metrics["r2"],
            "test_mae":        test_metrics["mae"],
            "test_rmse":       test_metrics["rmse"],
            "test_r2":         test_metrics["r2"],
            "best_iteration":  model.best_iteration,
        })

        mlflow.sklearn.log_model(model, "xgboost_model")
        save_model(model, "xgboost")

        run_id = mlflow.active_run().info.run_id
        print(f"  MLflow run_id : {run_id}")

    return model, test_metrics


# ─────────────────────────────────────────────────────────────────────────────
# MODÈLE 3 — LSTM
# ─────────────────────────────────────────────────────────────────────────────

def train_lstm(X_train, X_val, X_test, y_train, y_val, y_test,
               sequence_len: int = 6):
    """
    LSTM : réseau de neurones pour les séries temporelles.
    
    Pourquoi ?
    - Les données sont temporelles (toutes les heures)
    - Le LSTM a une "mémoire" : il se souvient des 6 dernières heures
    - Peut capturer des patterns complexes non-linéaires dans le temps
    
    sequence_len : combien d'heures passées le modèle regarde (défaut = 6h)
    """
    print("\n" + "="*50)
    print("MODÈLE 3 — LSTM")
    print("="*50)

    # Import Keras ici pour ne pas bloquer si non installé
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        from tensorflow.keras.optimizers import Adam
    except ImportError:
        print("  TensorFlow non installé. Lance : pip install tensorflow")
        print("  Skipping LSTM...")
        return None, None

    # ── Normalisation (obligatoire pour les réseaux de neurones) ──────────────
    scaler_X = StandardScaler()
    scaler_y = StandardScaler()

    X_train_s = scaler_X.fit_transform(X_train)
    X_val_s   = scaler_X.transform(X_val)
    X_test_s  = scaler_X.transform(X_test)

    y_train_s = scaler_y.fit_transform(y_train.values.reshape(-1, 1)).ravel()
    y_val_s   = scaler_y.transform(y_val.values.reshape(-1, 1)).ravel()

    # ── Créer des séquences [t-5, t-4, ..., t] → y[t+1] ─────────────────────
    def make_sequences(X, y, seq_len):
        Xs, ys = [], []
        for i in range(seq_len, len(X)):
            Xs.append(X[i - seq_len:i])
            ys.append(y[i])
        return np.array(Xs), np.array(ys)

    X_tr_seq, y_tr_seq = make_sequences(X_train_s, y_train_s, sequence_len)
    X_vl_seq, y_vl_seq = make_sequences(X_val_s,   y_val_s,   sequence_len)

    n_features = X_train_s.shape[1]
    print(f"  Séquences créées : train={X_tr_seq.shape}, val={X_vl_seq.shape}")
    print(f"  Features : {n_features} | Séquence : {sequence_len}h")

    # ── Architecture du réseau ─────────────────────────────────────────────────
    with mlflow.start_run(run_name="LSTM"):

        params = {
            "sequence_len":  sequence_len,
            "lstm_units_1":  64,
            "lstm_units_2":  32,
            "dropout":       0.2,
            "learning_rate": 0.001,
            "batch_size":    32,
            "max_epochs":    100,
        }
        mlflow.log_params(params)

        model = Sequential([
            Input(shape=(sequence_len, n_features)),
            LSTM(params["lstm_units_1"], return_sequences=True),
            Dropout(params["dropout"]),
            LSTM(params["lstm_units_2"], return_sequences=False),
            Dropout(params["dropout"]),
            Dense(16, activation="relu"),
            Dense(1),
        ])

        model.compile(
            optimizer=Adam(learning_rate=params["learning_rate"]),
            loss="mae",
        )
        model.summary()

        # Callbacks
        early_stop = EarlyStopping(
            monitor="val_loss", patience=15,
            restore_best_weights=True, verbose=1
        )
        reduce_lr = ReduceLROnPlateau(
            monitor="val_loss", factor=0.5,
            patience=7, min_lr=1e-5, verbose=1
        )

        # Entraînement
        history = model.fit(
            X_tr_seq, y_tr_seq,
            validation_data=(X_vl_seq, y_vl_seq),
            epochs=params["max_epochs"],
            batch_size=params["batch_size"],
            callbacks=[early_stop, reduce_lr],
            verbose=1,
        )

        print(f"  Entraînement arrêté à l'époque {len(history.history['loss'])}")

        # Prédictions (sur test — recréer les séquences)
        X_test_seq, _ = make_sequences(
            X_test_s,
            np.zeros(len(X_test_s)),
            sequence_len
        )
        y_test_trimmed = y_test.values[sequence_len:]

        pred_s    = model.predict(X_test_seq, verbose=0).ravel()
        test_pred = scaler_y.inverse_transform(pred_s.reshape(-1, 1)).ravel()

        test_metrics = compute_metrics(y_test_trimmed, test_pred, "Test")

        mlflow.log_metrics({
            "test_mae":    test_metrics["mae"],
            "test_rmse":   test_metrics["rmse"],
            "test_r2":     test_metrics["r2"],
            "epochs_run":  len(history.history["loss"]),
            "final_val_loss": float(history.history["val_loss"][-1]),
        })

        mlflow.keras.log_model(model, "lstm_model")

        # Sauvegarder le modèle et les scalers ensemble
        lstm_bundle = {
            "model_weights": model.get_weights(),
            "model_config":  model.to_json(),
            "scaler_X":      scaler_X,
            "scaler_y":      scaler_y,
            "sequence_len":  sequence_len,
        }
        save_model(lstm_bundle, "lstm_bundle")

        run_id = mlflow.active_run().info.run_id
        print(f"  MLflow run_id : {run_id}")

    return model, test_metrics


# ─────────────────────────────────────────────────────────────────────────────
# COMPARAISON ET SÉLECTION DU MEILLEUR MODÈLE
# ─────────────────────────────────────────────────────────────────────────────

def select_best_model(results: dict):
    """
    Compare les 3 modèles et sauvegarde le meilleur.
    Critère : MAE le plus bas (on veut l'erreur la plus petite en litres).
    """
    print("\n" + "="*50)
    print("COMPARAISON DES MODÈLES")
    print("="*50)

    print(f"\n{'Modèle':<20} {'MAE (L)':<12} {'RMSE (L)':<12} {'R²':<8}")
    print("-" * 52)

    best_name  = None
    best_mae   = float("inf")

    for name, metrics in results.items():
        if metrics is None:
            continue
        mae, rmse, r2 = metrics["mae"], metrics["rmse"], metrics["r2"]
        marker = " ← meilleur" if mae < best_mae else ""
        print(f"{name:<20} {mae:<12.2f} {rmse:<12.2f} {r2:<8.3f}{marker}")
        if mae < best_mae:
            best_mae  = mae
            best_name = name

    print(f"\nMeilleur modèle : {best_name} (MAE = {best_mae:.2f} L/heure)")

    # Copier le meilleur modèle comme "best_model.pkl"
    import shutil
    src = Path("models") / f"{best_name.lower().replace(' ', '_')}.pkl"
    dst = Path("models") / "best_model.pkl"
    if src.exists():
        shutil.copy(src, dst)
        print(f"Meilleur modèle sauvegardé → models/best_model.pkl")

    return best_name


# ─────────────────────────────────────────────────────────────────────────────
# POINT D'ENTRÉE
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    # ── Configurer MLflow ─────────────────────────────────────────────────────
    # Si tu utilises DagHub, remplace par :
    # mlflow.set_tracking_uri("https://dagshub.com/TON_USER/TON_REPO.mlflow")
    mlflow.set_tracking_uri("mlruns")
    mlflow.set_experiment("irrigation-intelligente")

    # ── Charger les données ───────────────────────────────────────────────────
    X_train, X_val, X_test, y_train, y_val, y_test = load_splits()

    # ── Entraîner les 3 modèles ───────────────────────────────────────────────
    _, rf_metrics   = train_random_forest(X_train, X_val, X_test,
                                          y_train, y_val, y_test)

    _, xgb_metrics  = train_xgboost(X_train, X_val, X_test,
                                     y_train, y_val, y_test)

    _, lstm_metrics = train_lstm(X_train, X_val, X_test,
                                  y_train, y_val, y_test)

    # ── Sélectionner le meilleur ──────────────────────────────────────────────
    results = {
        "RandomForest": rf_metrics,
        "XGBoost":      xgb_metrics,
        "LSTM":         lstm_metrics,
    }
    best = select_best_model(results)

    print("\nTerminé ! Lance 'mlflow ui' pour voir les résultats.")
