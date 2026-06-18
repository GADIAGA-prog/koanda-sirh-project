# SIRH Koanda Group

Plateforme de gestion des ressources humaines multi-filiales pour Koanda Group.
Modèle d'accès à deux niveaux : un **DRH Groupe** (accès consolidé à toutes les filiales)
et un **Responsable RH par filiale** (accès strictement limité à son périmètre).

Filiales : GCM Industries · Faso Energy · AMKO Trading · Eco-Oil · Eco Food · GCM Immobilier.

```
koanda-sirh/
├── frontend/   → Application web (Vite + React + Tailwind)
└── backend/    → API REST (FastAPI + SQLAlchemy)
```

---

## Ouvrir dans VS Code

```bash
cd koanda-sirh
code .
```

Extensions VS Code recommandées (VS Code les proposera automatiquement, cf. `.vscode/extensions.json`) :
- **ESLint** et **Prettier** — qualité et formatage du code
- **Tailwind CSS IntelliSense** — autocomplétion des classes
- **Python** + **Pylance** — pour le backend
- **Ruff** — linting Python

---

## 1. Lancer le front-end

```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:5173

Le front-end fonctionne aujourd'hui avec des **données générées en mémoire** : choisissez un
profil sur l'écran de connexion (DRH ou un RH de filiale) pour explorer le contrôle d'accès,
les tableaux de bord, l'annuaire, les congés et la page Paramètres (barème de paie modifiable,
vidage / régénération des données).

## 2. Lancer le backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

→ API : http://localhost:8000 · Documentation interactive : http://localhost:8000/docs

Voir `backend/README.md` pour les comptes de démonstration et la liste des endpoints.

---

## Brancher le front-end sur l'API (prochaine étape)

Aujourd'hui les deux parties sont indépendantes. Pour les connecter :

1. Dans `frontend/`, créer un fichier `.env` :
   ```
   VITE_API_URL=http://localhost:8000
   ```
2. Remplacer les générateurs en mémoire de `src/App.jsx`
   (`buildWorkforce`, `buildLeaves`) par des appels `fetch` vers l'API, et l'écran de connexion
   par un appel à `POST /auth/login` (le jeton JWT est ensuite envoyé dans l'en-tête
   `Authorization: Bearer …`).
3. Activer CORS côté backend est déjà fait (`CORS_ORIGINS` dans `.env`).

C'est une étape idéale à faire pas à pas dans VS Code avec Claude Code.

---

## Pile technique

| Côté      | Technologies |
|-----------|--------------|
| Front-end | React 18, Vite, Tailwind CSS, Recharts, lucide-react |
| Back-end  | FastAPI, SQLAlchemy 2, PyJWT, bcrypt, SQLite/PostgreSQL |

## Avertissement

Les barèmes de paie (CNSS, IUTS) et les durées de congés sont des estimations à faire
valider par votre service paie et au regard du Code du travail burkinabè avant tout usage réel.
