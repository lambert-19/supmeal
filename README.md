# SUPMEAL

Application de gestion de recettes et de planification de repas : recettes personnelles, cookbooks partagés (invitations, rôles, chat en temps réel), planning hebdomadaire avec liste de courses automatique, et suggestions intelligentes de recettes.

Le projet est découpé en deux dossiers indépendants, chacun avec son propre README détaillé :

- [`backend/`](backend/README.md)  API REST (Node.js + Express 5 + Prisma + PostgreSQL) : authentification, permissions, temps réel (Socket.io), OAuth2, documentation interactive (Swagger).
- [`frontend/`](frontend/README.md)  Client web (React 19 + Vite + Tailwind) consommant cette API.

## Démo en ligne

- Application : **https://supmeal.vercel.app**
- API : **https://supmeal.onrender.com** (documentation interactive : `/api-docs`)

Hébergement gratuit (Vercel + Render + Neon) — le backend peut mettre jusqu'à ~50 secondes à répondre après une période d'inactivité 

## Démarrage rapide

```bash
docker compose up -d --build
```

Lance les 3 services (PostgreSQL, backend, frontend) sur les mêmes ports qu'en développement local (`http://localhost:5173`, API sur `http://localhost:4000`)  voir le README de chaque dossier pour l'installation manuelle (`npm install` + `npm run dev`) et les variables d'environnement à renseigner au préalable.




