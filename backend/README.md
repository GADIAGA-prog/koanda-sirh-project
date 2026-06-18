# SIRH Koanda Group — Backend (API)

API REST de gestion des ressources humaines multi-filiales pour Koanda Group.
Construite avec **FastAPI + SQLAlchemy**. Cœur métier : le **contrôle d'accès par périmètre**
(le DRH Groupe voit tout ; chaque Responsable RH est strictement limité à sa filiale),
un **barème de paie modifiable** (CNSS, IUTS) et la possibilité de **vider / régénérer la base**.

## Filiales gérées
GCM Industries · Faso Energy · AMKO Trading · Eco-Oil · Eco Food · GCM Immobilier

## Démarrage rapide (local, SQLite)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API : http://localhost:8000
- **Documentation interactive (Swagger)** : http://localhost:8000/docs

Au premier démarrage, la base est créée et peuplée automatiquement : 6 filiales,
les comptes RH/DRH, le barème de paie et un effectif de démonstration (~1 580 collaborateurs).

## Démarrage avec PostgreSQL (Docker)

```bash
docker compose up --build
```

## Comptes de démonstration

| Profil                       | Email                       | Mot de passe | Périmètre          |
|------------------------------|-----------------------------|--------------|--------------------|
| Directrice RH Groupe (DRH)   | drh@koanda-group.bf         | koanda2026   | Toutes les filiales|
| Responsable RH — GCM         | rh.gcm@koanda-group.bf      | koanda2026   | GCM Industries     |
| Responsable RH — Faso Energy | rh.faso@koanda-group.bf     | koanda2026   | Faso Energy        |
| Responsable RH — AMKO        | rh.amko@koanda-group.bf     | koanda2026   | AMKO Trading       |
| Responsable RH — Eco-Oil     | rh.eco@koanda-group.bf      | koanda2026   | Eco-Oil            |
| Responsable RH — Eco Food    | rh.ecofood@koanda-group.bf  | koanda2026   | Eco Food           |
| Responsable RH — GCM Immobilier | rh.gcmimmo@koanda-group.bf | koanda2026  | GCM Immobilier     |

## Authentification

```bash
# 1. Obtenir un jeton
curl -X POST http://localhost:8000/auth/login \
  -d "username=rh.gcm@koanda-group.bf&password=koanda2026"

# 2. Appeler une route protégée
curl http://localhost:8000/employees -H "Authorization: Bearer <TOKEN>"
```

## Principaux endpoints

| Méthode | Route                         | Accès        | Rôle |
|---------|-------------------------------|--------------|------|
| POST    | `/auth/login`                 | public       | — |
| GET     | `/auth/me`                    | authentifié  | — |
| GET     | `/filiales`                   | authentifié  | structure du groupe |
| GET     | `/filiales/stats`             | scoped       | comparatif (DRH : toutes ; RH : la sienne) |
| GET     | `/employees`                  | scoped       | liste paginée, recherche, filtres |
| POST    | `/employees`                  | scoped       | création (filiale forcée pour un RH) |
| GET     | `/employees/{id}`             | scoped       | fiche |
| GET     | `/employees/{id}/payslip`     | scoped       | bulletin calculé |
| GET     | `/leaves`                     | scoped       | demandes de congé |
| PATCH   | `/leaves/{id}`                | scoped       | approuver / refuser |
| GET     | `/payroll/config`             | authentifié  | barème courant |
| PUT     | `/payroll/config`             | **DRH**      | modifier le barème |
| POST    | `/payroll/config/reset`       | **DRH**      | restaurer le barème officiel |
| GET     | `/payroll/preview?brut=...`   | authentifié  | simulateur |
| POST    | `/admin/clear`                | **DRH**      | vider la base (collaborateurs + congés) |
| POST    | `/admin/seed-demo`            | **DRH**      | régénérer les données de démonstration |
| GET     | `/admin/audit`                | **DRH**      | journal d'audit |

« scoped » = la réponse est automatiquement restreinte à la filiale du demandeur
(un RH ne peut pas lire ni écrire hors de son périmètre ; toute tentative renvoie `403`).

## Barème de paie (modifiable)

Le calcul (`app/security.py → compute_payslip`) s'appuie sur un barème stocké en base
et modifiable via `PUT /payroll/config` :

- **CNSS salariale** : taux (%) et plafond (FCFA)
- **CNSS patronale** : taux (%)
- **IUTS** : tranches progressives `[{ "ceil": 30000, "rate": 0 }, … , { "ceil": null, "rate": 25 }]`

Valeurs par défaut alignées sur le Burkina Faso (CNSS 5,5 % plafonnée à 600 000 FCFA,
charge patronale 16 %, barème IUTS progressif). À faire valider par votre service paie
avant usage réel.

## Tests

```bash
python test_api.py
```

Vérifie l'isolation des périmètres, la restriction des actions DRH, le calcul de paie
configurable et les opérations d'administration.

## Structure

```
backend/
├── app/
│   ├── main.py            # création de l'app, CORS, seed au démarrage
│   ├── config.py          # variables d'environnement
│   ├── database.py        # session SQLAlchemy
│   ├── models.py          # Filiale, User, Employee, Leave, PayrollConfig, AuditLog
│   ├── schemas.py         # validation Pydantic
│   ├── security.py        # hachage, JWT, calcul de paie
│   ├── deps.py            # authentification + contrôle de périmètre  ← logique centrale
│   ├── seed.py            # données de référence + effectif de démo
│   └── routers/           # auth, filiales, employees, leaves, payroll, admin
├── requirements.txt
├── Dockerfile / docker-compose.yml
└── .env.example
```

## Prochaines étapes suggérées

- Brancher le front-end React sur cette API (remplacer les données en mémoire par des appels HTTP).
- Migrations de schéma (Alembic) au lieu de `create_all`.
- SSO/MFA, rôles Manager et Employé (self-service), modules recrutement et performance persistés.
- Validation des barèmes CNSS/IUTS exacts avec un expert paie burkinabè.
