# 🔎 SportLens — Recherche d'images par CLIP fine-tuné

Moteur de **recherche d'images sportives** (texte → image et image → image) qui compare en direct **CLIP pré-entraîné (zero-shot)** et **CLIP fine-tuné** sur le domaine *Sport & Outdoor*.

> Projet réalisé dans le cadre du Master AIDC (M2 IA).

---

## 🎯 Objectif

Montrer l'apport du fine-tuning de CLIP sur un domaine précis : pour une même requête, l'interface affiche côte à côte les résultats du modèle de base et du modèle adapté, avec le gain de confiance, et un benchmark **Recall@K**.

## 🧠 Approche

- **Modèle de base** : `openai/clip-vit-base-patch32` (embeddings de dimension 512).
- **Données** : 12 682 images du jeu **Flickr30k**, sous-ensemble *Sport & Outdoor*.
- **Baseline zero-shot** : CLIP brut + index FAISS.
- **Modèle fine-tuné (V3)** : CLIP partiellement fine-tuné + **adaptateurs de projection** (un pour le texte, un pour l'image), de forme `Linear → GELU → Dropout → Linear` avec connexion résiduelle et normalisation L2.
- **Itérations comparées** : zero-shot, V1, V2, V3.
- **Recherche** : index FAISS `IndexFlatIP` (produit scalaire sur vecteurs normalisés = similarité cosinus), deux index indépendants (zero-shot et fine-tuné).
- **Évaluation** : Recall@1 / @5 / @10 en texte → image et en image → image.

## 📊 Résultats

### Texte → image (Recall@K, en %)

| Modèle | Recall@1 | Recall@5 | Recall@10 |
|---|---|---|---|
| Zero-shot (baseline) | 21,2 | 41,9 | 50,7 |
| Fine-tuné V1 | 22,7 | 45,8 | 57,2 |
| Fine-tuné V2 | 27,4 | 51,2 | 62,0 |
| **Fine-tuné V3** | **28,0** | **52,5** | **62,7** |

Le fine-tuning V3 apporte **+6,8 points** de Recall@1, **+10,6** de Recall@5 et **+12,0** de Recall@10 par rapport au zero-shot.

### Image → image (Recall@K, en %)

| Modèle | Recall@1 | Recall@5 | Recall@10 |
|---|---|---|---|
| Zero-shot | 68,0 | 88,7 | 92,6 |
| Fine-tuné V3 | 70,7 | 89,2 | 92,2 |

Pour la recherche par image, le gain est modeste (+2,7 points à Recall@1) et le Recall@10 est quasi identique (−0,3 point) : le zero-shot est déjà très performant sur cette tâche, le fine-tuning profite surtout à la recherche par texte.

## 🏗️ Architecture

```
Frontend React (Vite)  ──HTTP──►  API FastAPI
  ├─ SearchBar (texte / image)      ├─ POST /search/text
  ├─ ComparatorView (côte à côte)   ├─ POST /search/image
  └─ MetricsDashboard (Recall@K)    ├─ GET  /metrics, /metrics/image-to-image
                                    ├─ GET  /status, /health
                                    └─ /images (fichiers statiques)
                                         │
                                   DualSearchEngine
                          ┌──────────────┴──────────────┐
                    CLIP zero-shot                 CLIP fine-tuné + adaptateurs
                    + index FAISS baseline         + index FAISS fine-tuné
```

## 🧰 Stack technique

| Couche | Technologies |
|---|---|
| Modèle | PyTorch, Hugging Face Transformers (CLIP) |
| Recherche vectorielle | FAISS (CPU) |
| API | FastAPI, Uvicorn, Pydantic |
| Frontend | React, Vite, Framer Motion, Recharts, Axios |

## 📁 Structure

```
.
├── app/                       # Backend
│   ├── main.py                # Routes FastAPI
│   ├── config.py              # Chemins et paramètres
│   ├── schemas.py             # Modèles Pydantic
│   ├── models/
│   │   ├── clip_model.py      # Encodage texte / image
│   │   └── adapter_model.py   # Adaptateur de projection
│   ├── indexing/faiss_index.py
│   ├── search/search_engine.py
│   └── data/                  # (non versionné, sauf metrics/)
│       ├── images/
│       ├── index/
│       ├── checkpoints/
│       └── metrics/
├── frontend/                  # Interface React
│   └── src/components/        # SearchBar, ComparatorView, MetricsDashboard
├── notebooks/                 # Entraînement et évaluation
├── requirements.txt
└── README.md
```

## 📦 Données et modèles (non inclus)

Les fichiers volumineux ne sont pas dans ce dépôt :

| Élément | Chemin attendu | Où le trouver |
|---|---|---|
| Images Flickr30k (sous-ensemble) | `app/data/images/` | Jeu Flickr30k, à télécharger séparément (licence recherche) |
| Checkpoint fine-tuné | `app/data/checkpoints/adapter_v3_best.pt` | ✏️ *lien à ajouter (Hugging Face / Drive)* |
| Index FAISS | `app/data/index/*.index` et `*_id_to_path.json` | ✏️ *lien à ajouter, ou à régénérer via le notebook* |

Sans ces fichiers, l'API démarre mais `/status` indique les moteurs comme non prêts.

## 🚀 Installation et lancement

**Prérequis** : Python 3.10+, Node.js 18+.

### Backend (depuis la racine du projet)

```bash
python -m venv .venv
# Windows : .venv\Scripts\activate      Linux/Mac : source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```
Vérifier : http://localhost:8000/status et http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Ouvrir l'URL affichée (en général http://localhost:5173). Le frontend appelle l'API sur `http://localhost:8000`.

## 🔌 API

| Endpoint | Rôle |
|---|---|
| `POST /search/text` | `{query, top_k, mode}` → résultats zero-shot et fine-tuné |
| `POST /search/image` | Upload d'image → résultats des deux modèles |
| `GET /metrics` | Recall@K texte → image (zero-shot, V1, V2, V3) |
| `GET /metrics/image-to-image` | Recall@K image → image |
| `GET /status`, `/health` | État des index et modèles |

`mode` : `zero_shot`, `finetuned` ou `compare`.

## 👩‍💻 Auteur

**Fatima-ezzahra AMARZOUG** — Master AIDC (M2 IA)

## 📄 Licence

Projet académique — usage éducatif. Les images Flickr30k restent soumises à leur propre licence.
