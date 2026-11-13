# Backend Python (Flask + MongoDB)

Remplace l'ancien backend Express **et** le fichier `resultats-cache.json` :
tout (comptes, combinaisons, alertes, notifications **et tirages**) est dans MongoDB.

```
backend/
├── app/
│   ├── __init__.py        create_app() : API + service du front compilé (dist/)
│   ├── config.py          variables d'environnement (.env)
│   ├── db.py              connexion MongoDB + index
│   ├── security.py        bcrypt + JWT, décorateurs login_required / admin_required
│   ├── routes/            auth, users, alerts, notifications, combinations, admin, draws
│   ├── scraper/           scraper FDJ (HTTP + JSON embarqué, pas de navigateur)
│   ├── services/alerts.py alertes évaluées côté serveur -> notifications
│   └── worker.py          mise à jour automatique après chaque tirage
├── manage.py              commandes (run, scrape, worker, create-admin, import-json)
├── wsgi.py                point d'entrée production (gunicorn / waitress)
└── tests/                 tests (base MongoDB simulée, aucune connexion requise)
```

## Compatibilité avec l'ancien backend

- **Mêmes collections MongoDB** (`users`, `combinations`, `alerts`, `notifications`) : aucune migration.
- **Mots de passe** : les hachages bcryptjs (`$2a$…`) sont acceptés tels quels.
- **JWT** : même format (`{id}`, HS256). Avec les mêmes `JWT_SECRET` / `JWT_REFRESH_SECRET`,
  les utilisateurs déjà connectés le restent.
- **Mêmes routes et réponses** `/api/auth`, `/api/users`, `/api/alerts`, `/api/notifications`,
  `/api/combinations`, `/api/admin`. Chaque document expose `_id` **et** `id`.

Nouveautés : `/api/draws` (résultats), alertes déclenchées par le serveur (plus besoin d'ouvrir le site),
vérification des gains avec les vrais rangs FDJ (+ montant si le tirage est en base),
correction du compteur « alertes actives » de l'admin.

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate                      # Windows (source .venv/bin/activate ailleurs)
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env      # puis remplir MONGODB_URI et les secrets JWT
```

## Commandes

```bash
python backend/manage.py run --debug        # API sur http://127.0.0.1:5000 (+ npm run dev pour le front)
python backend/manage.py scrape             # met à jour les tirages (+ alertes)
python backend/manage.py worker             # worker continu
python backend/manage.py worker --once      # un passage (tâche planifiée / cron)
python backend/manage.py create-admin "Nom" email@exemple.fr "motdepasse"
python backend/manage.py import-json backend/data/ancien-resultats-cache.json
```

`import-json` reprend l'historique de l'ancien fichier (la FDJ ne publie qu'environ 2 mois de
résultats). À lancer une fois ; le fichier peut ensuite être supprimé.

## API des tirages

| Route | Réponse |
|---|---|
| `GET /api/draws?limit=200` | `{ euromillions: [...], loto: [...], eurodreams: [...], nextDraws, lastUpdate }` |
| `GET /api/draws/<jeu>?limit=50&before=AAAA-MM-JJ` | `{ data: [...], nextDraw, lastUpdate }` |
| `GET /api/draws/<jeu>/<AAAA-MM-JJ>` | `{ data: {...} }` |

Jeux : `euromillions`, `loto`, `eurodreams`, `keno`, `crescendo`, `amigo`. Crescendo et Amigo ont plusieurs
tirages par jour : leur id contient l'heure (`amigo-2026-11-13-1935`) et chaque tirage a un champ `time`.
Keno et Amigo ont des gains fixes : leur barème (`payouts`) n'est renvoyé qu'avec le tirage le plus récent.
Les combinaisons, alertes et notifications concernent les trois jeux à grille (EuroMillions, Loto, EuroDreams).

Réponses en cache 60 s + ETag (réponse 304 si rien n'a changé), compressées en gzip.

## Production

Un seul service suffit : Flask sert l'API **et** le front (`npm run build` puis `SERVE_FRONTEND=true`).

```bash
gunicorn --chdir backend wsgi:app --bind 0.0.0.0:$PORT --workers 2
```

Le worker tourne à part (`python backend/manage.py worker`), ou bien via la GitHub Action
`.github/workflows/update-fdj.yml` (secret `MONGODB_URI`) si l'hébergeur n'accepte pas de process permanent.

## Tests

```bash
pip install -r backend/requirements-dev.txt
python -m pytest backend -q
```
