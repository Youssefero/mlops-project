#!/bin/bash
# =============================================================================
# DVC SETUP COMPLET — Projet Irrigation Intelligente
# =============================================================================
# Ce script configure DVC pas à pas.
# Lance-le depuis la racine du projet : smart-irrigation-mlops/
# =============================================================================

echo "============================================"
echo "  DVC SETUP — Irrigation Intelligente"
echo "============================================"

# -----------------------------------------------------------------------------
# ÉTAPE 1 : Installer DVC
# -----------------------------------------------------------------------------
echo ""
echo "[1/6] Installation de DVC..."
pip install dvc dvc-gdrive

# Vérifier l'installation
dvc --version
echo "DVC installé ✓"

# -----------------------------------------------------------------------------
# ÉTAPE 2 : Initialiser DVC dans le projet Git
# -----------------------------------------------------------------------------
echo ""
echo "[2/6] Initialisation DVC..."

# Assure-toi d'être à la racine du projet
# cd smart-irrigation-mlops/

# Initialiser DVC (Git doit déjà être initialisé)
dvc init

# DVC crée automatiquement ces fichiers :
#   .dvc/             → dossier de config DVC
#   .dvc/.gitignore   → fichiers à ignorer par Git
#   .dvcignore        → équivalent .gitignore pour DVC

echo "DVC initialisé ✓"

# Committer l'initialisation dans Git
git add .dvc .dvcignore
git commit -m "init: DVC initialization"

# -----------------------------------------------------------------------------
# ÉTAPE 3 : Créer la structure des dossiers data/
# -----------------------------------------------------------------------------
echo ""
echo "[3/6] Création des dossiers data/..."

mkdir -p data/raw
mkdir -p data/processed
mkdir -p data/features
mkdir -p models

# Copier les CSV bruts dans data/raw/
cp stuard_environmental_data.csv  data/raw/
cp stuard_soil_data.csv           data/raw/
cp stuard_water_meter_data.csv    data/raw/
cp indicators.csv                 data/raw/

echo "Dossiers créés et CSV copiés ✓"

# -----------------------------------------------------------------------------
# ÉTAPE 4 : Tracker les données avec DVC (dvc add)
# -----------------------------------------------------------------------------
echo ""
echo "[4/6] Tracking des données avec DVC..."

# Tracker le dossier raw/ entier (les 4 CSV bruts)
dvc add data/raw/

# DVC crée : data/raw.dvc  (fichier de tracking avec hash MD5)
# Et ajoute : data/raw/ dans .gitignore automatiquement

# Tracker les dossiers de sortie (vides pour l'instant, remplis après preprocessing)
dvc add data/processed/
dvc add data/features/

# Tracker les modèles entraînés
dvc add models/

echo "Données trackées par DVC ✓"

# Committer les fichiers .dvc dans Git (pas les données elles-mêmes !)
git add data/raw.dvc data/processed.dvc data/features.dvc models.dvc
git add data/.gitignore models/.gitignore
git commit -m "data: add DVC tracking for raw data and outputs"

# -----------------------------------------------------------------------------
# ÉTAPE 5 : Configurer le remote storage (Google Drive - gratuit)
# -----------------------------------------------------------------------------
echo ""
echo "[5/6] Configuration du remote DVC (Google Drive)..."

# OPTION A : Google Drive (recommandé pour projet étudiant - gratuit)
# 1. Va sur drive.google.com
# 2. Crée un dossier appelé "dvc-irrigation-remote"
# 3. Ouvre ce dossier et copie l'ID depuis l'URL :
#    https://drive.google.com/drive/folders/1ABC123DEF456  ← cet ID
# 4. Remplace TON_FOLDER_ID ci-dessous

GDRIVE_FOLDER_ID="1GyXXPfPO5LBEo1dwqu2irj2lyrTFucCt"
dvc remote add -d myremote gdrive://$GDRIVE_FOLDER_ID

# Nommer le remote "myremote" et le mettre par défaut (-d)

echo "Remote Google Drive configuré ✓"
echo "Remote URL : gdrive://$GDRIVE_FOLDER_ID"

# Committer la config du remote
git add .dvc/config
git commit -m "dvc: configure Google Drive remote storage"

# -----------------------------------------------------------------------------
# ÉTAPE 6 : Push les données vers le remote
# -----------------------------------------------------------------------------
echo ""
echo "[6/6] Push des données vers le remote..."

# Envoyer les données vers Google Drive
# (La première fois, un navigateur s'ouvre pour l'authentification Google)
dvc push

echo ""
echo "============================================"
echo "  SETUP TERMINÉ ✓"
echo "============================================"
echo "  Tes données sont versionnées avec DVC !"
echo "  Utilise 'dvc push' pour envoyer les données"
echo "  Utilise 'dvc pull' pour les récupérer"
echo "============================================"
