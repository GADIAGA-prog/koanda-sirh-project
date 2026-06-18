# CLAUDE.md — SIRH Koanda Group

> Ce fichier est lu par Claude Code à chaque session.
> Il encode le contexte, les décisions d'architecture, et les règles de travail du projet.
> Inspiré des principes de Karpathy : **"Don't be clever. Be clear."**

---

## 1. Ce que tu construis

Un **SIRH (Système d'Information des Ressources Humaines)** pour Koanda Group,
un conglomérat burkinabè basé à Ouagadougou avec 6 filiales :

| ID        | Filiale          | Secteur                        |
|-----------|------------------|-------------------------------|
| gcm       | GCM Industries   | Ciment & matériaux             |
| faso      | Faso Energy      | Énergie solaire                |
| amko      | AMKO Trading     | Hydrocarbures — négoce         |
| eco       | Eco-Oil          | Distribution pétrolière        |
| ecofood   | Eco Food         | Agroalimentaire & distribution |
| gcmimmo   | GCM Immobilier   | Immobilier & promotion         |

**Règle métier centrale et non négociable :**
- Le **DRH Groupe** (`filiale_id = NULL`) voit et administre toutes les filiales.
- Un **RH de filiale** ne voit QUE sa filiale — cette restriction est appliquée
  côté SQL dans `backend/app/deps.py → resolve_scope()`, pas seulement dans l'UI.
- Tout accès hors périmètre retourne HTTP 403. Des tests vérifient ça dans `test_api.py`.

---

## 2. Architecture

```
koanda-sirh-project/
├── frontend/          # Vite + React 18 + Tailwind CSS + Recharts
│   └── src/
│       ├── App.jsx    # Application complète (composants, état, logique UI)
│       ├── api.js     # Couche réseau → API REST (à créer / en cours)
│       ├── main.jsx   # Point d'entrée React
│       └── index.css  # Tailwind base
├── backend/           # FastAPI + SQLAlchemy 2 + SQLite/PostgreSQL
│   └── app/
│       ├── main.py        # App FastAPI, CORS, lifespan (seed au démarrage)
│       ├── models.py      # ORM : Filiale, User, Employee, Leave, PayrollConfig, AuditLog
│       ├── schemas.py     # Pydantic : validation I/O de l'API
│       ├── security.py    # JWT, bcrypt, calcul de paie (compute_payslip)
│       ├── deps.py        # Auth + contrôle de périmètre ← LOGIQUE CENTRALE
│       ├── seed.py        # Données de démo (~1 580 collaborateurs)
│       └── routers/       # auth, filiales, employees, leaves, payroll, admin
├── render.yaml        # Blueprint Render (front statique + API Docker)
└── CLAUDE.md          # Ce fichier
```

**Déploiement :**
- Front : site statique sur Render → `https://koanda-sirh-front.onrender.com`
- API : Docker (python:3.11-slim) sur Render → `https://koanda-sirh-api.onrender.com`
- CI/CD : chaque `git push` sur `main` redéploie automatiquement les deux services.

---

## 3. Stack & versions

| Couche    | Technologie                        | Version   |
|-----------|------------------------------------|-----------|
| Frontend  | React                              | 18.3.x    |
| Frontend  | Vite                               | 5.x       |
| Frontend  | Tailwind CSS                       | 3.x       |
| Frontend  | Recharts                           | 2.x       |
| Frontend  | lucide-react                       | 0.408.x   |
| Backend   | Python                             | **3.11**  |
| Backend   | FastAPI                            | 0.111.x   |
| Backend   | SQLAlchemy                         | 2.0.x     |
| Backend   | Pydantic                           | 2.7.x     |
| Backend   | PyJWT + bcrypt                     | latest    |
| DB locale | SQLite (fichier `koanda_sirh.db`)  | —         |
| DB prod   | PostgreSQL via `DATABASE_URL`      | 16.x      |

⚠️ **Ne jamais passer à Python 3.12+ sans vérifier la compatibilité pydantic-core.**
Render utilisait Python 3.14 par défaut — c'est pour ça qu'on utilise Docker.

---

## 4. Variables d'environnement

### Backend (`backend/.env` en local, variables Render en prod)
```
DATABASE_URL=sqlite:///./koanda_sirh.db   # prod: postgresql+psycopg2://...
SECRET_KEY=<généré par Render>
DEMO_PASSWORD=koanda2026
CORS_ORIGINS=https://koanda-sirh-front.onrender.com
```

### Frontend (`frontend/.env.local` en local, variables Render en prod)
```
VITE_API_URL=https://koanda-sirh-api.onrender.com
```
Si `VITE_API_URL` est absent → l'app tourne en mode mémoire (données générées localement).
C'est le **fallback de développement** : ne jamais le supprimer.

---

## 5. Comptes de démonstration

| Rôle                  | Email                          | Mot de passe  | Périmètre        |
|-----------------------|--------------------------------|---------------|------------------|
| DRH Groupe            | drh@koanda-group.bf            | koanda2026    | Toutes filiales  |
| RH GCM Industries     | rh.gcm@koanda-group.bf         | koanda2026    | GCM uniquement   |
| RH Faso Energy        | rh.faso@koanda-group.bf        | koanda2026    | Faso uniquement  |
| RH AMKO Trading       | rh.amko@koanda-group.bf        | koanda2026    | AMKO uniquement  |
| RH Eco-Oil            | rh.eco@koanda-group.bf         | koanda2026    | Eco uniquement   |
| RH Eco Food           | rh.ecofood@koanda-group.bf     | koanda2026    | Eco Food unique  |
| RH GCM Immobilier     | rh.gcmimmo@koanda-group.bf     | koanda2026    | GCM Immo unique  |

---

## 6. Commandes utiles

```bash
# --- Frontend ---
cd frontend
npm install          # installer les dépendances
npm run dev          # serveur de développement → http://localhost:5173
npm run build        # build de production (vérifie qu'il passe avant tout commit)

# --- Backend ---
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload    # API → http://localhost:8000
                                 # Docs → http://localhost:8000/docs

# --- Tests backend ---
python test_api.py   # vérifie périmètre, paie, admin (ne nécessite pas de serveur lancé)

# --- Git ---
git add -A && git commit -m "..." && git push   # déclenche le redéploiement Render
```

---

## 7. Principes de travail (Karpathy-style)

### Pense d'abord, code ensuite
Avant de modifier un fichier, dis ce que tu vas faire et pourquoi.
Si la tâche est ambiguë, pose une question courte avant de commencer.
Ne génère pas de code "au cas où" — chaque ligne doit avoir une raison.

### Lis avant d'écrire
Avant de modifier `App.jsx`, `deps.py` ou `models.py`, relis le fichier entier.
Ces fichiers sont denses et cohérents — une modification partielle peut casser l'ensemble.

### Zéro régression
Le mode mémoire (sans `VITE_API_URL`) doit toujours fonctionner.
Le contrôle de périmètre (RH limité à sa filiale) ne doit jamais être contourné.
`npm run build` doit passer sans erreur après chaque modification du frontend.
`python test_api.py` doit passer après chaque modification du backend.

### Changements petits et traçables
Préfère plusieurs petits commits ciblés à un gros commit fourre-tout.
Format de commit : `type: description courte` (feat / fix / refactor / docs / chore).
Exemples : `feat: login JWT dans App.jsx`, `fix: CORS en production`, `refactor: api.js`.

### Ne pas casser le déploiement
Le `render.yaml` utilise `runtime: docker` pour le backend — ne pas le changer en `python`.
Le Dockerfile utilise `python:3.11-slim` — ne pas monter au-dessus de 3.11 sans test.
Le port exposé dans le Dockerfile est `10000` (exigence Render) — ne pas changer.

### Données sensibles
Ne jamais committer `.env`, `koanda_sirh.db`, `.venv/`, `node_modules/`.
Le `.gitignore` les exclut déjà — vérifier avant tout `git add -A`.

---

## 8. État actuel du projet (à mettre à jour après chaque session)

| Module              | Statut          | Notes                                              |
|---------------------|-----------------|----------------------------------------------------|
| Front (UI)          | ✅ En ligne      | Mode mémoire, données générées                     |
| API (backend)       | ✅ En ligne      | Docker, Python 3.11, seed auto au démarrage        |
| Login JWT réel      | 🔄 En cours      | `api.js` à créer, écran login à brancher           |
| Données persistées  | 🔄 En cours      | Nécessite connexion front ↔ API                    |
| CORS                | ⚠️ À resserrer   | Actuellement `*`, à remplacer par l'URL du front   |
| Tests frontend      | ❌ À faire       | Pas encore de tests React                          |
| Migrations Alembic  | ❌ À faire       | Actuellement `create_all` au démarrage             |

---

## 9. Ce qui n'est PAS encore fait (backlog)

- [ ] Brancher `api.js` dans `App.jsx` (login JWT, données réelles)
- [ ] Rôles Manager et Employé (self-service)
- [ ] Module Recrutement persisté en base
- [ ] Module Performance / OKR
- [ ] Migrations Alembic (remplacement de `Base.metadata.create_all`)
- [ ] Tests unitaires frontend (Vitest)
- [ ] Domaine personnalisé (koanda-sirh.com ou équivalent)
- [ ] PostgreSQL persistant (Neon ou Render payant — SQLite se réinitialise au redémarrage)

---

*Dernière mise à jour : 18 juin 2026 — déploiement initial Render réussi (front ✅ + API ✅)*
