#!/usr/bin/env bash
# =============================================================================
# DVC SETUP COMPLET — Projet Irrigation Intelligente
# =============================================================================
# Ce script configure DVC pas à pas.
# Lance-le depuis la racine du projet.
# Compatible Windows + Git Bash grâce à `py -m dvc`.
# =============================================================================

set -u

echo "============================================"
echo "  DVC SETUP — Irrigation Intelligente"
echo "============================================"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
git_commit_if_needed() {
  local message="$1"
  if git diff --cached --quiet; then
    echo "Aucun changement Git à commit pour : $message"
  else
    git commit -m "$message"
  fi
}

warn() {
  echo "AVERTISSEMENT: $1"
}

# Détecter la commande pip la plus fiable
if command -v py >/dev/null 2>&1; then
  PIP_CMD=(py -m pip)
elif command -v python >/dev/null 2>&1; then
  PIP_CMD=(python -m pip)
else
  echo "Erreur : ni 'py' ni 'python' n'est disponible."
  exit 1
fi

# Détecter la commande DVC la plus fiable
if command -v dvc >/dev/null 2>&1; then
  DVC_CMD=(dvc)
elif command -v py >/dev/null 2>&1 && py -m dvc --version >/dev/null 2>&1; then
  DVC_CMD=(py -m dvc)
else
  DVC_CMD=()
fi

# -----------------------------------------------------------------------------
# ÉTAPE 1 : Installer DVC
# -----------------------------------------------------------------------------
echo ""
echo "[1/6] Installation de DVC..."

"${PIP_CMD[@]}" install --user dvc dvc-gdrive

# Re-détecter DVC après installation
if command -v dvc >/dev/null 2>&1; then
  DVC_CMD=(dvc)
elif command -v py >/dev/null 2>&1 && py -m dvc --version >/dev/null 2>&1; then
  DVC_CMD=(py -m dvc)
else
  echo "Erreur : DVC est installé mais introuvable. Essaie avec 'py -m dvc --version'."
  exit 1
fi

"${DVC_CMD[@]}" --version
echo "DVC installé ✓"

# -----------------------------------------------------------------------------
# ÉTAPE 2 : Initialiser DVC dans le projet Git
# -----------------------------------------------------------------------------
echo ""
echo "[2/6] Initialisation DVC..."

if [ ! -d .git ]; then
  echo "Erreur : ce dossier n'est pas un dépôt Git initialisé."
  exit 1
fi

if [ -d .dvc ]; then
  echo "DVC est déjà initialisé dans ce projet."
else
  "${DVC_CMD[@]}" init
fi

echo "DVC initialisé ✓"

git add .dvc .dvcignore 2>/dev/null || true
git_commit_if_needed "init: DVC initialization"

# -----------------------------------------------------------------------------
# ÉTAPE 3 : Créer la structure des dossiers data/
# -----------------------------------------------------------------------------
echo ""
echo "[3/6] Création des dossiers data/..."

mkdir -p data/raw
mkdir -p data/processed
mkdir -p data/features
mkdir -p models

CSV_FILES=(
  "stuard_environmental_data.csv"
  "stuard_soil_data.csv"
  "stuard_water_meter_data.csv"
  "indicators.csv"
)

for csv in "${CSV_FILES[@]}"; do
  if [ -f "$csv" ]; then
    cp "$csv" "data/raw/"
    echo "Copié depuis la racine : $csv"
  elif [ -f "data/raw/$csv" ]; then
    echo "Déjà présent dans data/raw : $csv"
  else
    warn "Fichier introuvable : $csv"
  fi
done

echo "Dossiers vérifiés et CSV traités ✓"

# -----------------------------------------------------------------------------
# ÉTAPE 4 : Tracker les données avec DVC (dvc add)
# -----------------------------------------------------------------------------
echo ""
echo "[4/6] Tracking des données avec DVC..."

if [ -n "$(find data/raw -maxdepth 1 -type f 2>/dev/null)" ]; then
  "${DVC_CMD[@]}" add data/raw
else
  warn "Aucun fichier trouvé dans data/raw, tracking ignoré."
fi

# DVC ne tracke pas utilement les dossiers vides.
if [ -n "$(find data/processed -mindepth 1 2>/dev/null)" ]; then
  "${DVC_CMD[@]}" add data/processed
else
  echo "data/processed est vide : tracking DVC ignoré pour l'instant."
fi

if [ -n "$(find data/features -mindepth 1 2>/dev/null)" ]; then
  "${DVC_CMD[@]}" add data/features
else
  echo "data/features est vide : tracking DVC ignoré pour l'instant."
fi

if [ -n "$(find models -mindepth 1 ! -name '.gitkeep' 2>/dev/null)" ]; then
  "${DVC_CMD[@]}" add models
else
  echo "models est vide : tracking DVC ignoré pour l'instant."
fi

echo "Données trackées par DVC ✓"

[ -f "data/raw.dvc" ] && git add data/raw.dvc
[ -f "data/processed.dvc" ] && git add data/processed.dvc
[ -f "data/features.dvc" ] && git add data/features.dvc
[ -f "models.dvc" ] && git add models.dvc
[ -f "data/.gitignore" ] && git add data/.gitignore
[ -f "models/.gitignore" ] && git add models/.gitignore

git_commit_if_needed "data: add DVC tracking for raw data and outputs"

# -----------------------------------------------------------------------------
# ÉTAPE 5 : Configurer le remote storage (Google Drive)
# -----------------------------------------------------------------------------
echo ""
echo "[5/6] Configuration du remote DVC (Google Drive)..."

GDRIVE_FOLDER_ID="1GyXXPfPO5LBEo1dwqu2irj2lyrTFucCt"
"${DVC_CMD[@]}" remote add -d -f myremote "gdrive://$GDRIVE_FOLDER_ID"

echo "Remote Google Drive configuré ✓"
echo "Remote URL : gdrive://$GDRIVE_FOLDER_ID"

[ -f ".dvc/config" ] && git add .dvc/config
git_commit_if_needed "dvc: configure Google Drive remote storage"

# -----------------------------------------------------------------------------
# ÉTAPE 6 : Push des données vers le remote
# -----------------------------------------------------------------------------
echo ""
echo "[6/6] Push des données vers le remote..."

if ! "${DVC_CMD[@]}" push; then
  warn "Le push DVC a échoué. Relance manuellement avec : py -m dvc push"
  warn "La première exécution peut demander une authentification Google."
fi

echo ""
echo "============================================"
echo "  SETUP TERMINÉ ✓"
echo "============================================"
echo "  Tes données sont versionnées avec DVC !"
echo "  Utilise 'py -m dvc push' pour envoyer les données"
echo "  Utilise 'py -m dvc pull' pour les récupérer"
echo "============================================"
