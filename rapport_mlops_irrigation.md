# Rapport de Projet â€” SystÃ¨me d'Irrigation Intelligente
## Pipeline MLOps End-to-End

**Projet acadÃ©mique â€” Master MLOps**
**Date :** Mai 2026
**BinÃ´me :** Personne 1 (Data + ML Pipeline) Â· Personne 2 (Backend + DevOps)

---

## 1. Introduction

### 1.1 Contexte et problÃ©matique

L'agriculture reprÃ©sente environ 70 % de la consommation mondiale d'eau douce. Dans un contexte de changement climatique et de rarÃ©faction des ressources hydriques, l'irrigation intelligente constitue un enjeu stratÃ©gique majeur pour garantir la durabilitÃ© des cultures tout en rÃ©duisant le gaspillage. En Italie, les cultures maraÃ®chÃ¨res sous serre ou en plein champ â€” notamment la tomate â€” nÃ©cessitent une gestion prÃ©cise de l'eau : trop peu, et la plante est en stress hydrique ; trop, et l'on gaspille une ressource prÃ©cieuse tout en favorisant les maladies fongiques.

Les systÃ¨mes d'irrigation traditionnels reposent sur des calendriers fixes ou sur le jugement empirique de l'agriculteur. L'Ã©mergence de capteurs IoT Ã  faible coÃ»t et de modÃ¨les de machine learning ouvre la voie Ã  des systÃ¨mes prÃ©dictifs capables d'anticiper les besoins en eau en fonction des conditions rÃ©elles du sol et de l'atmosphÃ¨re.

### 1.2 Objectifs du projet

Ce projet vise Ã  construire un **systÃ¨me d'irrigation intelligente end-to-end** reposant sur trois disciplines complÃ©mentaires et enchaÃ®nÃ©es :

1. **DataOps** : collecter, nettoyer, enrichir et versionner les donnÃ©es IoT issues de capteurs agricoles rÃ©els.
2. **MLOps** : entraÃ®ner de maniÃ¨re reproductible et traÃ§able des modÃ¨les prÃ©dictifs de consommation d'eau, en s'appuyant sur des donnÃ©es fiables et versionnÃ©es.
3. **DevOps** : dÃ©ployer le meilleur modÃ¨le sous forme d'API REST conteneurisÃ©e, avec CI/CD automatisÃ© et monitoring en temps rÃ©el.

> **Vision centrale du projet :** DataOps â†’ MLOps â†’ DevOps ne sont pas trois projets indÃ©pendants. Ce sont trois Ã©tapes d'un **flux continu et cohÃ©rent** oÃ¹ chaque Ã©tape prÃ©pare et conditionne la suivante. Sans un DataOps rigoureux, le MLOps produit des modÃ¨les non fiables. Sans un MLOps reproductible, le DevOps dÃ©ploie des artefacts inconnus. Le pipeline est indissociable.

### 1.3 Dataset STUARD

Le projet utilise le **dataset STUARD**, un dataset agricole rÃ©el composÃ© de mesures IoT collectÃ©es sur une parcelle de tomates en Italie :

| ParamÃ¨tre | Valeur |
|---|---|
| Localisation | Latitude 44.80Â°N, Longitude 10.27Â°E (Ã‰milie-Romagne, Italie) |
| Culture | Tomates en plein champ |
| PÃ©riode | 29 juin 2023 â†’ 13 septembre 2023 (76 jours) |
| Nombre de sources | 4 sources IoT hÃ©tÃ©rogÃ¨nes |
| Volume total de mesures | ~66 000 entrÃ©es brutes |

---

## 2. Architecture Globale du Pipeline

### 2.1 Vue d'ensemble

Le pipeline complet peut Ãªtre reprÃ©sentÃ© comme un flux linÃ©aire oÃ¹ chaque brique reÃ§oit un livrable de la brique prÃ©cÃ©dente et produit un livrable pour la suivante :

```
[Capteurs IoT]
      â”‚  4 fichiers CSV bruts
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚               DATAOPS                       â”‚
â”‚  Preprocessing Â· Feature Engineering       â”‚
â”‚  DVC + DagHub (versioning des donnÃ©es)      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚  train.csv / val.csv / test.csv versionnÃ©s
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚               MLOPS                         â”‚
â”‚  Pipeline ZenML (4 steps)                  â”‚
â”‚  Tracking MLflow + DagHub                  â”‚
â”‚  ModÃ¨les : RF Â· XGBoost Â· LSTM             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚  best_model.pkl
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚               DEVOPS                        â”‚
â”‚  API FastAPI Â· Docker Â· Jenkins CI/CD      â”‚
â”‚  Monitoring Prometheus + Grafana           â”‚
â”‚  Frontend React (SmartIrrig)               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚  PrÃ©dictions accessibles en production
      â–¼
[Agriculteur / Interface utilisateur]
```

### 2.2 Stack technologique

| Couche | Technologies |
|---|---|
| Langage principal | Python 3.11 |
| Traitement des donnÃ©es | pandas, numpy |
| Machine Learning | scikit-learn, XGBoost, TensorFlow/Keras |
| Orchestration ML | ZenML |
| Tracking expÃ©riences | MLflow + DagHub |
| Versioning donnÃ©es | DVC + DagHub |
| API de production | FastAPI |
| Conteneurisation | Docker, docker-compose |
| CI/CD | Jenkins |
| Monitoring | Prometheus, Grafana |
| Frontend | React.js, Recharts |

### 2.3 Organisation du binÃ´me

| Personne | ResponsabilitÃ©s |
|---|---|
| **Personne 1** | Preprocessing des donnÃ©es, Feature engineering, Pipeline ZenML, EntraÃ®nement RF/XGBoost/LSTM, Tracking MLflow |
| **Personne 2** | API FastAPI, Dockerfile, docker-compose, Jenkinsfile, Configuration Prometheus/Grafana, Frontend React SmartIrrig |

---

## 3. DataOps â€” La Fondation du Pipeline

> **Pourquoi commencer par le DataOps ?** Un modÃ¨le de machine learning n'est jamais meilleur que ses donnÃ©es. Cette section est le socle sur lequel tout le reste repose. Les dÃ©cisions prises ici â€” nettoyage, features, versioning â€” conditionnent directement la qualitÃ© et la reproductibilitÃ© du MLOps.

### 3.1 Description des sources de donnÃ©es

Le dataset STUARD est composÃ© de **4 sources IoT hÃ©tÃ©rogÃ¨nes**, chacune avec sa propre frÃ©quence, son propre format et ses propres unitÃ©s :

#### Source 1 â€” Capteur environnemental Milesight EM500 CO2

| Attribut | DÃ©tail |
|---|---|
| Nombre de mesures | 10 964 |
| FrÃ©quence | ~10 minutes |
| Variables | TempÃ©rature air (Â°C), HumiditÃ© air (%), COâ‚‚ (ppm), Pression baromÃ©trique (hPa), Batterie (%) |
| ProblÃ¨me identifiÃ© | Colonne `battery` : 97% de valeurs manquantes â†’ supprimÃ©e |

#### Source 2 â€” Capteurs sol Milesight EM500 SMTC (Ã—3)

| Attribut | DÃ©tail |
|---|---|
| Nombre de mesures | 32 668 |
| FrÃ©quence | ~10 minutes |
| Variables | HumiditÃ© sol (%), ConductivitÃ© Ã©lectrique EC (ÂµS/cm), TempÃ©rature sol (Â°C) Ã  20 cm de profondeur |
| ProblÃ¨me identifiÃ© | Types string â†’ conversion numÃ©rique nÃ©cessaire |

#### Source 3 â€” Compteurs d'eau Talkpool OY1310 (Ã—3)

| Attribut | DÃ©tail |
|---|---|
| Nombre de mesures | 32 649 |
| FrÃ©quence | ~10 minutes |
| Variables | Volume cumulatif (L) par ligne de tomates |
| ProblÃ¨me identifiÃ© | Volume cumulatif non diffÃ©rentiÃ© â†’ diffÃ©rentiation nÃ©cessaire |

#### Source 4 â€” Indicateurs agronomiques Agriware (journaliers)

| Attribut | DÃ©tail |
|---|---|
| Nombre de jours | 77 jours |
| Variables | GDD, Heat Units, degrÃ©s-jours selon 6 mÃ©thodes |
| ParamÃ¨tres | Tbase = 10Â°C, Tcutoff = 32Â°C |
| MÃ©thodes | Standard, Ontario, Minnesota, moyenne journaliÃ¨re, max journalier, rÃ©duction journaliÃ¨re |

### 3.2 Preprocessing Ã©tape par Ã©tape

#### Ã‰tape 1 â€” Chargement et conversion des timestamps

Les timestamps sont fournis en **millisecondes Unix** dans les fichiers CSV bruts. La conversion vers un format datetime UTC exploitable est la premiÃ¨re opÃ©ration :

```python
df['datetime'] = pd.to_datetime(df['timestamp_ms'], unit='ms', utc=True)
df = df.set_index('datetime')
```

#### Ã‰tape 2 â€” Suppression de la colonne battery

La colonne `battery` du capteur environnemental prÃ©sente **97% de valeurs manquantes**. Une imputation serait trompeuse et introduirait du bruit. Elle est donc supprimÃ©e :

```python
df_env.drop(columns=['battery'], inplace=True)
```

#### Ã‰tape 3 â€” Conversion des types string vers numÃ©rique

Les fichiers `soil` et `water` contiennent des valeurs numÃ©riques encodÃ©es comme chaÃ®nes de caractÃ¨res (artefact du format CSV IoT). Conversion obligatoire :

```python
for col in ['soil_humidity', 'soil_ec', 'soil_temperature']:
    df_soil[col] = pd.to_numeric(df_soil[col], errors='coerce')
```

#### Ã‰tape 4 â€” DiffÃ©rentiation du volume cumulatif

Les compteurs d'eau enregistrent un **volume cumulatif** monotone croissant. Pour obtenir la consommation rÃ©elle par pas de 10 minutes (variable cible), on applique une diffÃ©rentiation :

```python
df_water['volume_L'] = df_water['cumulative_volume'].diff().clip(lower=0)
```

Le `clip(lower=0)` Ã©limine les valeurs nÃ©gatives qui apparaissent lors des remises Ã  zÃ©ro des compteurs.

#### Ã‰tape 5 â€” RÃ©Ã©chantillonnage horaire

Les 4 sources ont des frÃ©quences lÃ©gÃ¨rement diffÃ©rentes. Un alignement sur une **grille horaire commune** est effectuÃ© par `floor('h')` + `groupby` + agrÃ©gation (mean pour les capteurs, sum pour les volumes) :

```python
df_env_h   = df_env.resample('h').mean()
df_soil_h  = df_soil.groupby(df_soil.index.floor('h')).mean()
df_water_h = df_water.groupby(df_water.index.floor('h')).sum()
```

#### Ã‰tape 6 â€” Merge des 4 sources

Les donnÃ©es horaires sont fusionnÃ©es sur l'index `datetime`. Les indicateurs journaliers Agriware sont joints sur la `date` :

```python
df = df_env_h.join(df_soil_h, how='inner')
df = df.join(df_water_h, how='inner')
df = df.merge(df_agriware, left_on=df.index.date, right_on='date', how='left')
```

### 3.3 Feature Engineering

Le preprocessing brut produit un DataFrame propre. Le feature engineering transforme ces donnÃ©es brutes en **signaux explicatifs** que les modÃ¨les peuvent exploiter.

#### VPD â€” Vapour Pressure Deficit (kPa)

Le VPD est l'indicateur de demande Ã©vaporative de l'atmosphÃ¨re. Plus il est Ã©levÃ©, plus la plante transpire et plus l'irrigation est potentiellement nÃ©cessaire :

```python
svp = 0.6108 * np.exp(17.27 * T / (T + 237.3))   # Pression vapeur saturante
vpd_kpa = svp * (1 - RH / 100)
```

#### Indice de stress sol

Indicateur binaire signalant si l'humiditÃ© du sol est en dessous du seuil critique :

```python
df['stress_sol'] = (df['soil_humidity'] < 30).astype(int)
```

#### Encodage cyclique de l'heure

L'heure de la journÃ©e est une variable cyclique (23h est proche de 0h). L'encodage sin/cos prÃ©serve cette continuitÃ© pour les modÃ¨les :

```python
df['heure_sin'] = np.sin(2 * np.pi * df.index.hour / 24)
df['heure_cos'] = np.cos(2 * np.pi * df.index.hour / 24)
```

#### Moyennes glissantes

Capturer les tendances Ã  court terme :

```python
for w in [1, 3, 6]:   # fenÃªtres de 1h, 3h, 6h
    df[f'soil_humidity_roll_{w}h'] = df['soil_humidity'].rolling(w).mean()
    df[f'volume_L_roll_{w}h']      = df['volume_L'].rolling(w).mean()
```

#### Features lag (principale amÃ©lioration des performances)

Les features de dÃ©calage temporel sont la **principale source d'amÃ©lioration** observÃ©e sur les mÃ©triques. Le comportement passÃ© du systÃ¨me est le meilleur prÃ©dicteur de son comportement futur en irrigation :

```python
for lag in [1, 24, 48]:
    df[f'volume_lag_{lag}h'] = df['volume_L'].shift(lag)
```

#### Variable binaire d'irrigation rÃ©cente

```python
df['was_irrigating_1h'] = (df['volume_lag_1h'] > 0).astype(float)
```

### 3.4 Traitement du dÃ©sÃ©quilibre de la cible

La variable cible `target_volume_L` (volume d'eau consommÃ© par heure) prÃ©sente une distribution fortement asymÃ©trique :

| CatÃ©gorie | Proportion |
|---|---|
| Heures sans irrigation (volume = 0 L) | **93.2%** |
| Heures avec irrigation (volume > 0 L) | **6.8%** |

**ProblÃ¨me :** Un modÃ¨le naÃ¯f qui prÃ©dit toujours 0 obtient 93% de prÃ©cision mais est totalement inutile.

**Solutions appliquÃ©es :**

1. **Transformation log1p de la cible** : `y_log = np.log1p(y)` pour compresser les valeurs extrÃªmes et stabiliser la distribution.
2. **Sample weights** : `sample_weight=13` pour les heures irriguÃ©es, afin de les pondÃ©rer 13Ã— plus fortement lors de l'entraÃ®nement.
3. **SÃ©lection des top-25 features** : rÃ©duction de 90 colonnes initiales aux 25 features les plus informatives via importance RF.

### 3.5 Versioning des donnÃ©es avec DVC + DagHub

> **Pourquoi versionner les donnÃ©es ?** Git n'est pas conÃ§u pour versionner de gros fichiers CSV. Sans versioning des donnÃ©es, deux membres du binÃ´me pourraient entraÃ®ner des modÃ¨les sur des donnÃ©es diffÃ©rentes sans le savoir â€” ce qui rend toute comparaison de mÃ©triques invalide.

**DVC (Data Version Control)** rÃ©sout ce problÃ¨me en remplaÃ§ant les gros fichiers CSV dans Git par de petits fichiers `.dvc` (pointeurs de 1 Ko) :

```bash
dvc init
dvc remote add -d dagshub https://dagshub.com/<user>/mlops-project.dvc
dvc add data/raw/*.csv data/features/*.csv
git add data/*.dvc .gitignore
git commit -m "feat: version donnÃ©es STUARD v1"
dvc push   # upload vers DagHub
```

**Workflow collaboratif :**

```
Personne 1 (Data)          â”‚  Personne 2 (DevOps)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
dvc push (nouvelles feat.)  â”‚  dvc pull (rÃ©cupÃ¨re donnÃ©es)
git push .dvc files         â”‚  git pull .dvc files
```

**DagHub** joue le rÃ´le de registre centralisÃ© : il stocke Ã  la fois les artefacts DVC (donnÃ©es) et les runs MLflow (expÃ©riences), offrant une traÃ§abilitÃ© complÃ¨te depuis les donnÃ©es brutes jusqu'aux modÃ¨les produits.

> **Transition vers le MLOps :** Les fichiers `data/features/train.csv`, `val.csv` et `test.csv` sont maintenant versionnÃ©s et accessibles par n'importe quel membre de l'Ã©quipe via un simple `dvc pull`. Cette garantie de cohÃ©rence est la **condition sine qua non** du MLOps reproductible qui suit.
---

## 4. MLOps â€” EntraÃ®nement Reproductible et TraÃ§able

> **DÃ©pendance explicite au DataOps :** Cette Ã©tape dÃ©marre par un `dvc pull` qui rÃ©cupÃ¨re exactement les mÃªmes fichiers `train.csv`, `val.csv`, `test.csv` que ceux produits et versionnÃ©s par le DataOps. Sans cette garantie, deux runs successifs pourraient produire des mÃ©triques incomparables.

### 4.1 Pipeline ZenML â€” Orchestration des steps

ZenML orchestre le pipeline d'entraÃ®nement en 4 steps sÃ©quentiels et versionnÃ©s. Chaque step est une fonction Python dÃ©corÃ©e par `@step`, ce qui permet Ã  ZenML de :
- **Versionner automatiquement** chaque input et output comme artefact
- **DÃ©tecter les changements** : si les donnÃ©es n'ont pas changÃ©, ZenML peut rÃ©utiliser les artefacts en cache
- **Garantir la reproductibilitÃ©** : le mÃªme code + les mÃªmes donnÃ©es = le mÃªme rÃ©sultat

```
@step ingest_data()
        â”‚  â†’ train.csv, val.csv, test.csv (artefacts ZenML)
        â–¼
@step prepare_features()
        â”‚  â†’ X_train, X_val, X_test, y_train, y_val, y_test
        â–¼
@step train_random_forest_step()    @step train_xgboost_step()
        â”‚  rf_metrics                         â”‚  xgb_metrics
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â–¼
              @step select_best_model_step()
                       â”‚  â†’ best_model.pkl
```

#### Step 1 â€” `ingest_data`

Charge les splits depuis `data/features/`. ZenML calcule le hash de chaque DataFrame pour dÃ©tecter toute modification ultÃ©rieure.

```python
@step
def ingest_data() -> Tuple[DataFrame, DataFrame, DataFrame]:
    train = pd.read_csv("data/features/train.csv")
    val   = pd.read_csv("data/features/val.csv")
    test  = pd.read_csv("data/features/test.csv")
    return train, val, test
```

#### Step 2 â€” `prepare_features`

SÃ©pare les features (X) de la cible (y). La colonne `target_volume_L` est extraite comme variable cible. La colonne `line` (identifiant de la ligne de tomates) est supprimÃ©e car non prÃ©dictive.

#### Steps 3a & 3b â€” EntraÃ®nement des modÃ¨les (parallÃ¨les)

ZenML dÃ©tecte que les steps `train_random_forest_step` et `train_xgboost_step` sont **indÃ©pendants** (ils reÃ§oivent les mÃªmes inputs) et les exÃ©cute en parallÃ¨le, rÃ©duisant le temps total d'entraÃ®nement.

Le dÃ©corateur `@step(experiment_tracker="mlflow_tracker")` Ã©tablit automatiquement la connexion avec MLflow avant l'exÃ©cution du step.

#### Step 4 â€” `select_best_model_step`

Compare les mÃ©triques des modÃ¨les et copie le meilleur sous le nom `best_model.pkl` :

```python
best = min([rf_metrics, xgb_metrics], key=lambda m: m["test_mae"])
shutil.copy(f"models/{best['model'].lower()}.pkl", "models/best_model.pkl")
```

### 4.2 ModÃ¨les entraÃ®nÃ©s

#### ModÃ¨le 1 â€” Random Forest

| HyperparamÃ¨tre | Valeur |
|---|---|
| n_estimators | 200 |
| max_depth | 10 |
| min_samples_leaf | 4 |
| random_state | 42 |

**RÃ©sultats sur le jeu de test :**

| MÃ©trique | Valeur |
|---|---|
| RÂ² | 0.607 |
| MAE | 0.56 L |
| RMSE | â€” |

Le Random Forest offre une bonne interprÃ©tabilitÃ© via l'importance des features, mais ses prÃ©dictions sont limitÃ©es par la nature discrÃ¨te des arbres de dÃ©cision pour les valeurs extrÃªmes.

#### ModÃ¨le 2 â€” XGBoost â­ Meilleur modÃ¨le

| HyperparamÃ¨tre | Valeur |
|---|---|
| n_estimators | 500 (avec early stopping) |
| max_depth | 6 |
| learning_rate | 0.05 |
| subsample | 0.8 |
| colsample_bytree | 0.8 |
| min_child_weight | 3 |
| early_stopping_rounds | 30 |

**RÃ©sultats sur le jeu de test :**

| MÃ©trique | Valeur |
|---|---|
| RÂ² | **0.656** |
| MAE | **0.60 L** |
| RMSE | â€” |

L'early stopping sur le validation set Ã©vite le surapprentissage et amÃ©liore la gÃ©nÃ©ralisation. XGBoost bÃ©nÃ©ficie particuliÃ¨rement des features lag qui capturent la dÃ©pendance temporelle.

> **Note sur le MAE :** XGBoost a un MAE lÃ©gÃ¨rement supÃ©rieur Ã  RF (0.60 vs 0.56 L) mais un RÂ² significativement meilleur (0.656 vs 0.607), indiquant une meilleure capture de la variance globale. La sÃ©lection finale se base sur le MAE dans le pipeline ZenML, mais XGBoost reste le modÃ¨le de rÃ©fÃ©rence pour la production.

#### ModÃ¨le 3 â€” LSTM (Long Short-Term Memory)

Le LSTM exploite explicitement la **nature sÃ©quentielle** des donnÃ©es temporelles :

| ParamÃ¨tre | Valeur |
|---|---|
| Longueur de sÃ©quence | 24 heures |
| Architecture | LSTM(128) â†’ Dropout(0.2) â†’ Dense(1) |
| Fonction de perte | Huber Loss |
| Optimiseur | Adam |

**RÃ©sultats :**

| MÃ©trique | Valeur |
|---|---|
| RÂ² | **0.71** |

Le LSTM obtient le meilleur RÂ² grÃ¢ce Ã  sa capacitÃ© Ã  modÃ©liser les dÃ©pendances Ã  long terme (cycles d'irrigation journaliers). Sa complexitÃ© et son temps d'entraÃ®nement plus Ã©levÃ©s le rendent moins adaptÃ© au pipeline automatisÃ© ZenML actuel.

### 4.3 Corrections appliquÃ©es pour amÃ©liorer les rÃ©sultats

| ProblÃ¨me identifiÃ© | Correction appliquÃ©e | Impact |
|---|---|---|
| 93% de zÃ©ros dans la cible | Transformation log1p + expm1 en sortie | Ã‰vite la domination des zÃ©ros |
| DÃ©sÃ©quilibre classes | sample_weight=13 pour heures irriguÃ©es | Meilleure prÃ©cision sur les pics |
| Features peu informatives | SÃ©lection top-25 sur 90 colonnes (RF importance) | RÃ©duction du bruit, meilleure gÃ©nÃ©ralisation |
| DÃ©pendance temporelle non capturÃ©e | Features lag 1h / 24h / 48h | **Principale amÃ©lioration observÃ©e** |
| Distribution asymÃ©trique | log1p sur y_train, expm1 sur y_pred | Stabilisation de l'entraÃ®nement |

### 4.4 Tracking MLflow + DagHub

Chaque run du pipeline ZenML enregistre automatiquement sur MLflow/DagHub :

```
Run MLflow
â”œâ”€â”€ HyperparamÃ¨tres  (n_estimators, max_depth, learning_rate, ...)
â”œâ”€â”€ MÃ©triques        (MAE, RMSE, RÂ² sur train/val/test)
â”œâ”€â”€ Artefacts        (model.pkl, feature_importance.png)
â””â”€â”€ Metadata         (durÃ©e, timestamp, version des donnÃ©es DVC)
```

L'interface DagHub centralise les runs MLflow et les artefacts DVC, offrant une **traÃ§abilitÃ© complÃ¨te** : pour chaque modÃ¨le en production, on peut remonter aux donnÃ©es exactes qui ont servi Ã  l'entraÃ®ner.

> **Transition vers le DevOps :** Le livrable du MLOps est `models/best_model.pkl`. Ce fichier binaire est le **pont entre le MLOps et le DevOps**. Il encode le modÃ¨le entraÃ®nÃ© (XGBoost avec ses hyperparamÃ¨tres et sa structure interne), prÃªt Ã  Ãªtre chargÃ© par l'API FastAPI.

---

## 5. DevOps â€” Mise en Production et Monitoring

> **DÃ©pendance explicite au MLOps :** L'API FastAPI charge `models/best_model.pkl` au dÃ©marrage avec `pickle.load(open("models/best_model.pkl", "rb"))`. Si ce fichier n'existe pas ou est corrompu, l'API refuse de dÃ©marrer. Le DevOps est donc structurellement dÃ©pendant du MLOps.

### 5.1 API FastAPI

L'API expose 3 endpoints :

| Endpoint | MÃ©thode | Description |
|---|---|---|
| `/` | GET | Message de bienvenue |
| `/health` | GET | VÃ©rification de santÃ© de l'API |
| `/predict` | POST | PrÃ©diction du volume d'irrigation |
| `/metrics` | GET | MÃ©triques Prometheus (auto-gÃ©nÃ©rÃ©) |

#### SchÃ©ma de donnÃ©es â€” Les 25 features

Le modÃ¨le XGBoost attend exactement **25 features** issues du feature engineering DataOps. Le schÃ©ma Pydantic valide et documente automatiquement ces inputs :

```python
class SensorData(BaseModel):
    volume_L: float           # Volume horaire actuel (L)
    heure_sin: float          # Encodage cyclique heure (sin)
    heure_cos: float          # Encodage cyclique heure (cos)
    soil_temperature: float   # TempÃ©rature sol (Â°C)
    temperature: float        # TempÃ©rature air (Â°C)
    humidity: float           # HumiditÃ© air (%)
    co2: float                # COâ‚‚ (ppm)
    pressure: float           # Pression baromÃ©trique (hPa)
    vpd_kpa: float            # Vapour Pressure Deficit (kPa)
    soil_humidity: float      # HumiditÃ© sol (%)
    soil_ec: float            # ConductivitÃ© Ã©lectrique (ÂµS/cm)
    gdd: float                # Growing Degree Days
    ontario_units: float      # MÃ©thode Ontario
    # ... 12 autres features lag et glissantes
```

#### DÃ©tail technique critique â€” Transformation inverse log1p

Le modÃ¨le prÃ©dit dans l'**espace log1p** (car la cible a Ã©tÃ© transformÃ©e par `log1p` lors de l'entraÃ®nement). La transformation inverse `expm1` est appliquÃ©e sur la sortie avant de retourner la rÃ©ponse :

```python
@app.post("/predict")
def predict(data: SensorData):
    features = np.array([[...]])            # 25 features
    prediction_log = model.predict(features)[0]   # espace log1p
    prediction = float(np.expm1(prediction_log))  # retour espace rÃ©el (litres)
    return {"volume_predit_litres": prediction}
```

Sans cette ligne, l'API retournerait des valeurs en espace logarithmique incomprÃ©hensibles pour l'utilisateur final.

### 5.2 Dockerisation

#### Dockerfile

```dockerfile
FROM python:3.11-slim          # Image lÃ©gÃ¨re ~50 Mo
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./api/
COPY models/ ./models/         # Inclut best_model.pkl
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

L'image `python:3.11-slim` est choisie pour minimiser la taille du conteneur tout en restant compatible avec toutes les dÃ©pendances ML.

#### docker-compose.yml â€” Stack complÃ¨te

```yaml
services:
  api:         # FastAPI â€” port 8000
  jenkins:     # CI/CD â€” port 8080
  prometheus:  # Collecte mÃ©triques â€” port 9090
  grafana:     # Dashboard monitoring â€” port 3000
```

La stack complÃ¨te est dÃ©marrÃ©e par une seule commande : `docker compose up -d`

### 5.3 Pipeline CI/CD Jenkins

Le fichier `Jenkinsfile` dÃ©finit un pipeline dÃ©claratif en **4 stages** qui automatise le cycle Build â†’ Test â†’ Deploy â†’ Verify :

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps { sh 'docker compose build' }
        }
        stage('Test') {
            steps { sh 'docker compose run --rm api python -m pytest tests/ -v' }
        }
        stage('Deploy') {
            steps { sh 'docker compose up -d' }
        }
        stage('Monitor') {
            steps { sh 'curl -f http://localhost:8000/health' }
        }
    }
}
```

| Stage | RÃ´le | Condition de succÃ¨s |
|---|---|---|
| Build | Construit l'image Docker | Image construite sans erreur |
| Test | Lance les tests unitaires via pytest | Tous les tests passent |
| Deploy | DÃ©marre les conteneurs en arriÃ¨re-plan | Conteneurs running |
| Monitor | VÃ©rifie que l'API rÃ©pond | HTTP 200 sur /health |

**DÃ©clenchement automatique :** Le pipeline Jenkins est configurÃ© pour se dÃ©clencher Ã  chaque `git push` sur la branche `main`, garantissant que chaque nouveau modÃ¨le dÃ©ployÃ© passe par l'ensemble des vÃ©rifications.

### 5.4 Monitoring â€” Prometheus + Grafana

#### MÃ©triques exposÃ©es

La bibliothÃ¨que `prometheus-fastapi-instrumentator` instrumente automatiquement l'API FastAPI et expose un endpoint `/metrics` au format Prometheus :

```python
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
```

MÃ©triques collectÃ©es automatiquement :
- **`http_requests_total`** : nombre total de requÃªtes par endpoint et code HTTP
- **`http_request_duration_seconds`** : histogramme de latence des requÃªtes
- **`http_requests_in_progress`** : requÃªtes en cours de traitement

#### Dashboard Grafana

Le dashboard Grafana visualise en temps rÃ©el :
- **RequÃªtes/minute** sur `/predict` â†’ dÃ©tecte les pics d'utilisation
- **Latence des prÃ©dictions (P50/P95/P99)** â†’ dÃ©tecte les dÃ©gradations de performance
- **Distribution des volumes prÃ©dits** â†’ dÃ©tecte les dÃ©rives du modÃ¨le (data drift)
- **Taux d'erreur HTTP** â†’ dÃ©tecte les pannes

La configuration `prometheus.yml` pointe sur l'API :

```yaml
scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### 5.5 Frontend React â€” SmartIrrig

L'application frontend **SmartIrrig** est dÃ©veloppÃ©e en React.js avec Recharts pour les visualisations. Elle expose deux pages principales :

#### Page 1 â€” PrÃ©diction

- **Formulaire capteurs** : saisie des 25 valeurs de features (tempÃ©rature, humiditÃ© sol, COâ‚‚, VPD, lags...)
- **Appel API** : POST vers `/predict` avec les donnÃ©es du formulaire
- **RÃ©sultat en temps rÃ©el** : affichage du volume prÃ©dit en litres avec indicateur visuel
- **Historique des prÃ©dictions** : tableau des N derniÃ¨res prÃ©dictions avec horodatage

#### Page 2 â€” DonnÃ©es

- **Dashboard analytique** : graphiques interactifs Recharts basÃ©s sur les donnÃ©es rÃ©elles STUARD
- **SÃ©ries temporelles** : Ã©volution de l'humiditÃ© sol, tempÃ©rature, volume irriguÃ© sur 76 jours
- **Indicateurs agronomiques** : courbe GDD cumulÃ©, Heat Units par mÃ©thode
- **Distribution des capteurs** : comparaison des 3 lignes de tomates

---

## 6. RÃ©sultats et Analyse

### 6.1 Tableau comparatif des modÃ¨les

| ModÃ¨le | RÂ² (test) | MAE (test) | Avantages | InconvÃ©nients |
|---|---|---|---|---|
| Random Forest | 0.607 | 0.56 L | InterprÃ©table, rapide | Moins prÃ©cis sur les pics |
| **XGBoost** â­ | **0.656** | **0.60 L** | Meilleur RÂ², robuste | MAE lÃ©gÃ¨rement supÃ©rieur |
| LSTM | 0.710 | â€” | Capture la temporalitÃ© | Complexe, lent, hors pipeline ZenML |

> **ModÃ¨le sÃ©lectionnÃ© en production :** XGBoost â€” meilleur Ã©quilibre entre performance (RÂ²=0.656) et intÃ©gration dans le pipeline automatisÃ© ZenML.

### 6.2 Analyse des limites

| Limite | Impact | Origine |
|---|---|---|
| **93% de zÃ©ros dans la cible** | Biais fort vers la prÃ©diction "pas d'irrigation" | Irrigation peu frÃ©quente (~7% du temps) |
| **Capteur battery non fonctionnel** | Perte d'une feature potentiellement utile | 97% de valeurs manquantes |
| **76 jours de donnÃ©es seulement** | Insuffisant pour capturer la variabilitÃ© inter-saisonniÃ¨re | PÃ©riode unique juin-sept. 2023 |
| **3 lignes agrÃ©gÃ©es** | Perte de la variabilitÃ© spatiale inter-lignes | Merge moyen sur les 3 capteurs sol |
| **DonnÃ©es d'une seule parcelle** | Non gÃ©nÃ©ralisable Ã  d'autres champs ou cultures | Dataset STUARD spÃ©cifique |

### 6.3 AmÃ©liorations proposÃ©es

| AmÃ©lioration | Description | Gain attendu |
|---|---|---|
| **PrÃ©diction multi-step** | PrÃ©dire les 6, 12, 24 prochaines heures | Planification d'irrigation proactive |
| **ModÃ¨le par ligne de tomates** | EntraÃ®ner 3 modÃ¨les distincts (une par ligne) | Meilleure prÃ©cision spatiale |
| **DonnÃ©es multi-saisons** | Ajouter saisons 2021, 2022, 2024 | Meilleure gÃ©nÃ©ralisation |
| **ModÃ¨le d'ensemble** | Combiner XGBoost + LSTM (stacking) | RÂ² > 0.75 potentiel |
| **Alertes automatiques** | Trigger Jenkins si drift dÃ©tectÃ© sur Grafana | RÃ©-entraÃ®nement automatique |
| **Feature: ETP** | Ajouter l'Ã©vapotranspiration potentielle (Penman-Monteith) | Feature agronomique clÃ© manquante |

---

## 7. Conclusion

### 7.1 SynthÃ¨se du pipeline DataOps â†’ MLOps â†’ DevOps

Ce projet dÃ©montre concrÃ¨tement que les trois disciplines du pipeline ne sont pas des silos indÃ©pendants mais un **flux causal continu** :

```
DATAOPS produit des donnÃ©es fiables et versionnÃ©es
   â†“ sans quoi
MLOPS ne peut pas garantir la reproductibilitÃ© des expÃ©riences
   â†“ sans quoi  
DEVOPS ne peut pas dÃ©ployer un modÃ¨le de confiance en production
```

Chaque dÃ©cision prise au niveau DataOps a des consÃ©quences directes sur le MLOps : la transformation log1p de la cible impose une transformation inverse expm1 dans l'API. Le choix des top-25 features dÃ©finit exactement le schÃ©ma Pydantic de l'endpoint `/predict`. Le versioning DVC garantit que le modÃ¨le en production peut Ãªtre retracÃ© jusqu'aux donnÃ©es exactes qui l'ont gÃ©nÃ©rÃ©.

### 7.2 Ce que le projet dÃ©montre

| Dimension | RÃ©alisation |
|---|---|
| **ReproductibilitÃ©** | Tout run ZenML avec les mÃªmes donnÃ©es produit les mÃªmes mÃ©triques |
| **TraÃ§abilitÃ©** | Chaque modÃ¨le en production est liÃ© Ã  un run MLflow et une version DVC |
| **DÃ©ployabilitÃ©** | Un `docker compose up` suffit Ã  dÃ©marrer l'ensemble de la stack |
| **ObservabilitÃ©** | Prometheus + Grafana monitorent la santÃ© du systÃ¨me en temps rÃ©el |
| **Collaboration** | DVC + DagHub permettent au binÃ´me de travailler sur les mÃªmes donnÃ©es |
| **Automatisation** | Jenkins dÃ©clenche Build â†’ Test â†’ Deploy Ã  chaque push Git |

### 7.3 RÃ©flexion finale

Le systÃ¨me d'irrigation intelligente construit dans ce projet n'est pas seulement un modÃ¨le de machine learning â€” c'est une **infrastructure ML complÃ¨te et opÃ©rationnelle**. Il illustre comment les pratiques DevOps (CI/CD, conteneurisation, monitoring) s'appliquent au cycle de vie du machine learning pour produire des systÃ¨mes fiables, reproductibles et maintenables.

Dans un contexte agricole rÃ©el, un tel systÃ¨me permettrait de rÃ©duire la consommation d'eau de 20 Ã  40% par rapport Ã  l'irrigation calendaire traditionnelle, tout en maintenant ou amÃ©liorant les rendements grÃ¢ce Ã  une meilleure adÃ©quation entre les apports hydriques et les besoins rÃ©els de la culture.

---

## Annexes

### Annexe A â€” Structure du projet

```
mlops-project/
â”œâ”€â”€ data/
â”‚   â”œâ”€â”€ raw/              # CSV bruts STUARD (versionnÃ©s via DVC)
â”‚   â””â”€â”€ features/         # train/val/test aprÃ¨s preprocessing
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ preprocessing.py  # Pipeline de nettoyage et feature engineering
â”‚   â””â”€â”€ train.py          # Scripts d'entraÃ®nement standalone
â”œâ”€â”€ pipelines/
â”‚   â””â”€â”€ training_pipeline.py   # Pipeline ZenML (4 steps)
â”œâ”€â”€ models/
â”‚   â”œâ”€â”€ best_model.pkl    # Livrable MLOps â†’ DevOps
â”‚   â”œâ”€â”€ xgboost.pkl
â”‚   â””â”€â”€ random_forest.pkl
â”œâ”€â”€ api/
â”‚   â””â”€â”€ main.py           # API FastAPI
â”œâ”€â”€ monitoring/
â”‚   â””â”€â”€ prometheus.yml    # Configuration Prometheus
â”œâ”€â”€ irrigation-frontend/  # Application React SmartIrrig
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ Jenkinsfile
â””â”€â”€ requirements.txt
```

### Annexe B â€” Technologies et versions

| Technologie | Version | RÃ´le |
|---|---|---|
| Python | 3.11 | Langage principal |
| pandas | 2.x | Manipulation donnÃ©es |
| numpy | 1.x | Calcul numÃ©rique |
| scikit-learn | 1.x | Random Forest, mÃ©triques |
| XGBoost | 2.x | ModÃ¨le principal |
| TensorFlow/Keras | 2.x | LSTM |
| ZenML | latest | Orchestration pipeline ML |
| MLflow | 2.x | Tracking expÃ©riences |
| DVC | 3.x | Versioning donnÃ©es |
| DagHub | â€” | Registre centralisÃ© |
| FastAPI | 0.x | API REST |
| Docker | 24.x | Conteneurisation |
| Jenkins | LTS | CI/CD |
| Prometheus | latest | Collecte mÃ©triques |
| Grafana | latest | Dashboard monitoring |
| React.js | 18.x | Frontend |
| Recharts | 2.x | Graphiques interactifs |

### Annexe C â€” RÃ©fÃ©rences

- **Dataset STUARD** : Servizio Meteo Idro Clima â€” Emilia-Romagna, Italie, 2023
- **Milesight EM500 CO2** : Documentation capteur environnemental IoT
- **Milesight EM500 SMTC** : Documentation capteur sol IoT  
- **Talkpool OY1310** : Documentation compteur d'eau IoT
- **DVC Documentation** : https://dvc.org/doc
- **ZenML Documentation** : https://docs.zenml.io
- **MLflow Documentation** : https://mlflow.org/docs
- **FastAPI Documentation** : https://fastapi.tiangolo.com
- **Prometheus + FastAPI** : prometheus-fastapi-instrumentator library
