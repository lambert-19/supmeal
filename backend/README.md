# SUPMEAL — Backend

API REST du backend SUPMEAL. Node.js + Express 5 + Prisma + PostgreSQL, authentification locale par JWT (cookie httpOnly).

## Stack

- **Express 5** pour l'API REST
- **Prisma + PostgreSQL** pour la persistance (`prisma/schema.prisma`)
- **JWT** (`jsonwebtoken`) transmis via un **cookie httpOnly** (pas de token en `localStorage` côté client — protège contre le vol de token par XSS), `cookie-parser` pour le lire
- **bcryptjs** pour le hash des mots de passe
- **express-validator** pour la validation des requêtes
- **helmet**, **cors** (avec `credentials: true`) pour la sécurité de base
- **morgan** pour les logs de requêtes en dev
- **nodemailer** pour l'envoi des emails de vérification/réinitialisation (voir section dédiée ci-dessous)
- **swagger-jsdoc + swagger-ui-express** pour la documentation interactive de l'API (voir section dédiée ci-dessous)

**Hors périmètre pour l'instant** (prévu pour une passe suivante, cohérent avec les placeholders déjà présents côté frontend) : OAuth2 Google/GitHub réel, chat temps réel Socket.io, upload d'images via `multer` (les images restent des data URL base64 stockées telles quelles).

## Lancer le projet

```bash
npm install
npm run prisma:migrate:dev   # applique le schéma à la base (première fois / après modification du schéma)
npm run dev                   # démarre avec nodemon sur http://localhost:4000
```

Copier `.env.example` vers `.env` et renseigner `DATABASE_URL` (Postgres) + les autres variables avant de lancer.

Autres scripts : `npm start` (production, sans nodemon), `npm run prisma:generate`, `npm run prisma:studio` (explorateur de données).

Documentation interactive de l'API une fois le serveur lancé : http://localhost:4000/api-docs (spec brute en JSON : `/api-docs.json`).

## Variables d'environnement (`.env`)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `NODE_ENV` | `development` / `production` — influence les options du cookie JWT (`secure`, `sameSite`) |
| `PORT` | Port d'écoute de l'API (défaut 4000) |
| `JWT_SECRET` | Secret de signature des JWT — à générer aléatoirement, jamais commité |
| `COOKIE_NAME` | Nom du cookie contenant le JWT |
| `CORS_ORIGIN` | Origine(s) autorisée(s) en CORS, séparées par des virgules (ex. `http://localhost:5173,http://localhost:5174` — le port Vite varie selon disponibilité) |
| `FRONTEND_URL` | Origine du frontend, utilisée pour construire les liens envoyés par email (`/verify-email?token=...`, `/reset-password?token=...`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Configuration SMTP pour l'envoi réel des emails. **Optionnel** : si `SMTP_HOST` est vide, `utils/mailer.js` simule l'envoi et logge le lien dans la console au lieu d'envoyer un vrai email (pratique en dev sans compte mail) |
| `MAIL_FROM` | Adresse d'expéditeur affichée sur les emails envoyés |

## Structure

```
backend/
  index.js            point d'entrée : dotenv + app.listen
  app.js               construction de l'app Express (helmet, cors, cookie-parser, routers, error handler)
  prisma/
    schema.prisma        modèle de données complet (User, Recipe, Ingredient, Step, Cookbook, CookbookMember,
                          PlanningEntry, Comment, Message, VerificationToken)
    migrations/            historique des migrations Prisma
  utils/
    prisma.js              instance PrismaClient singleton
    password.js              hash/compare bcrypt
    jwt.js                    sign/verify JWT + options de cookie
    tokens.js                  génération de tokens de vérification/reset (aléatoires, stockés hashés en
                                DB via sha256 — jamais en clair), durées de validité (24h / 1h)
    mailer.js                   envoi des emails via nodemailer (ou simulation loggée si SMTP absent)
    permissions.js             port exact de frontend/src/lib/cookbook-permissions.js — LA source de vérité
                                pour les droits sur un cookbook, appliquée ici côté serveur (pas seulement UI)
    recipeAccess.js             résout l'accès à une recette (propriétaire OU membre du cookbook auquel
                                elle est rattachée) et le droit de la commenter, réutilisé par les recettes
                                et les commentaires
    serializers.js               formes de réponse JSON (toSafeUser masque le hash de mot de passe, etc.)
    swagger.js                    définition OpenAPI (schémas, sécurité cookie) + agrégation des annotations
                                  JSDoc `@swagger` présentes dans routes/*.routes.js, servie sur /api-docs
    AppError.js / asyncHandler.js   utilitaires d'erreurs/async
  middleware/
    auth.js                 requireAuth : lit le cookie, vérifie le JWT, attache req.user = { id }
    loadCookbook.js           charge un cookbook + calcule le rôle de l'utilisateur courant (req.cookbook, req.role)
    validate.js                exécute express-validator, 400 + détail des erreurs si échec
    errorHandler.js             middleware d'erreur centralisé (AppError, codes Prisma, JWT, 500 générique)
  routes/ controllers/ services/   un trio par domaine (auth, users, recipes, cookbooks, planning, comments,
                                    messages) — routes définissent les endpoints + validation, controllers
                                    gèrent req/res, services contiennent la logique métier + les appels Prisma
```

## Modèle de permissions (appliqué côté serveur)

Un cookbook a un créateur (`Cookbook.ownerId`, rôle implicite `"creator"`) et des membres (`CookbookMember`, rôle `editor`/`commentator`/`reader`), identifiés par email pour permettre des invitations "en attente" (`userId: null` tant que l'email ne correspond à aucun compte). `utils/permissions.js` calcule le rôle effectif d'un utilisateur sur un cookbook et expose les prédicats `canManageCookbook` (créateur uniquement), `canEditRecipes` (créateur/éditeur) et `canComment` (créateur/éditeur/commentateur, pas lecteur) — utilisés par `middleware/loadCookbook.js` et les contrôleurs pour autoriser chaque action.

**Convention 404 vs 403** : un utilisateur sans aucun rôle sur un cookbook (ou sans accès à une recette) reçoit systématiquement un `404` (la ressource "n'existe pas" pour lui) plutôt qu'un `403`, qui révélerait son existence. Le `403` est réservé aux utilisateurs qui ont un rôle mais des droits insuffisants pour l'action demandée.

Le champ `Recipe.cookbookId` ne peut **pas** être modifié via le `PATCH /recipes/:id` générique (uniquement réservé au propriétaire de la recette) — il faut passer par `POST/DELETE /cookbooks/:id/recipes/:recipeId`, qui vérifie en plus les droits d'édition sur le cookbook cible. Cela évite qu'un propriétaire de recette rattache sa recette à un cookbook dont il n'est pas membre éditeur/créateur.

### Invitation par lien sécurisé

`POST /cookbooks/:id/members` (`email`, `role`) se comporte différemment selon que l'email correspond déjà à un compte :

- **Compte existant** : rattachement immédiat (`CookbookMember.userId` renseigné), un simple email de notification est envoyé (pas de lien à cliquer, la personne peut déjà se connecter).
- **Pas de compte** : un token aléatoire à usage unique (`crypto.randomBytes(32)`, stocké hashé en sha256 dans `CookbookMember.inviteTokenHash`, jamais en clair) est généré, valable **7 jours**, et envoyé par email sous forme de lien `${FRONTEND_URL}/register?inviteToken=...`. `POST /auth/register` accepte un champ `inviteToken` optionnel : s'il correspond à une invitation valide et non expirée, le `CookbookMember` correspondant est automatiquement rattaché au nouveau compte (`userId`, `email`, `name` mis à jour, token supprimé — usage unique). Un token invalide, expiré ou déjà utilisé est **ignoré silencieusement** : il ne bloque jamais la création du compte.

Les réponses API sur les cookbooks/membres passent systématiquement par `toCookbookDTO`/`toCookbookMemberDTO` (`utils/serializers.js`), qui excluent `inviteTokenHash`/`inviteTokenExpiresAt` — le hash du token n'est jamais renvoyé au client, même si sa fuite ne permettrait pas de retrouver le token d'origine (hash à sens unique).

**SMS non implémenté** : envisagé un temps, mais tout fournisseur SMS fiable (Twilio et équivalents) est un service payant — écarté volontairement pour ce projet. L'invitation ne se fait donc que par email.

## Vérification d'email et réinitialisation de mot de passe

- `POST /auth/register` crée le compte (`emailVerified: false`) et envoie un email de vérification, **mais ne pose pas de cookie** — l'inscription ne connecte plus automatiquement l'utilisateur, contrairement à avant. `POST /auth/login` refuse la connexion avec `403` tant que `emailVerified` est `false`.
- Les tokens (vérification d'email et réinitialisation de mot de passe) sont générés côté serveur avec `crypto.randomBytes(32)`, envoyés en clair par email, mais **stockés hashés (sha256)** en base dans `VerificationToken.tokenHash` — un accès en lecture à la base ne permet donc pas de rejouer un lien envoyé. Chaque token est à usage unique (supprimé après consommation) et une nouvelle demande invalide toute demande précédente du même type pour cet utilisateur.
- Durées de validité : **24h** pour la vérification d'email, **1h** pour la réinitialisation de mot de passe (plus court car ce token permet de changer le mot de passe, action plus sensible).
- `POST /auth/resend-verification` et `POST /auth/forgot-password` renvoient toujours une réponse **générique identique**, que l'email corresponde à un compte ou non — évite qu'un attaquant énumère les comptes existants via ces endpoints.
- Sans configuration SMTP (`SMTP_HOST` absent), `utils/mailer.js` ne part pas réellement : le lien est loggé dans la console du serveur (`[mailer] SMTP non configuré...`), pratique pour tester en local sans compte mail.

## Documentation interactive (Swagger)

La spec OpenAPI 3 est générée à partir d'annotations JSDoc `@swagger` directement dans `routes/*.routes.js` (une annotation par endpoint, à côté de la définition de la route — pas de fichier séparé à maintenir en double). `utils/swagger.js` définit le socle (info, tags, schémas de `components.schemas` calqués sur les DTO de `utils/serializers.js`, schéma de sécurité `cookieAuth`) et agrège ces annotations via `swagger-jsdoc`.

- **UI interactive** : `GET /api-docs` (swagger-ui-express) — permet de tester les endpoints directement depuis le navigateur ("Try it out"). Le cookie de session posé par `POST /auth/login` sur le même domaine est automatiquement envoyé par le navigateur, donc les routes protégées fonctionnent une fois connecté via l'UI.
- **Spec brute** : `GET /api-docs.json` — utilisable pour générer un client, l'importer dans Postman/Insomnia, etc.
- Le header CSP posé par `helmet` est désactivé uniquement sur `/api-docs` (nécessaire au rendu de swagger-ui, qui utilise du JS/CSS inline) — inchangé sur le reste de l'API.
- Chaque endpoint documente sa méthode/paramètres/corps de requête, ses réponses possibles (avec les codes 400/401/403/404 pertinents référençant `components.responses`), et son tag de domaine (Auth, Users, Recipes, Cookbooks, Planning, Comments, Messages).

## Endpoints

| Domaine | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Users | `PATCH /users/me`, `PATCH /users/me/password`, `PATCH /users/me/preferences` |
| Recettes | `GET/POST /recipes` (filtres `q`, `tags`, `time`, `favorite`), `GET/PATCH/DELETE /recipes/:id`, `PATCH /recipes/:id/favorite` |
| Cookbooks | `GET/POST /cookbooks`, `GET/PATCH/DELETE /cookbooks/:id`, `GET /cookbooks/:id/recipes`, `POST/DELETE /cookbooks/:id/recipes/:recipeId`, `POST /cookbooks/:id/members`, `PATCH/DELETE /cookbooks/:id/members/:memberId` |
| Planning | `PUT /planning` (upsert sur `ownerId+date+mealSlot`), `GET /planning?from=&to=`, `DELETE /planning/:id` |
| Commentaires | `GET/POST /recipes/:id/comments`, `DELETE /comments/:commentId` |
| Messages | `GET/POST /cookbooks/:id/messages` |

## Vérification

Toutes les routes ont été testées via des scripts Node (`fetch` + assertions) simulant plusieurs comptes (créateur/éditeur/lecteur/étranger) : CRUD complet, filtres de recherche, upsert de planning, et surtout les cas de permissions (accès refusé, tentative de contournement des droits de cookbook via le PATCH générique, visibilité 404 vs 403). Le flux de vérification d'email et de réinitialisation de mot de passe est couvert par 24 assertions dédiées (token invalide/expiré/réutilisé, blocage du login tant que l'email n'est pas vérifié, réponse anti-énumération sur forgot-password). Le flux d'invitation par lien sécurisé est couvert par 32 assertions dédiées (compte existant vs invitation en attente, token invalide/déjà consommé qui n'empêche jamais l'inscription, rôle correctement appliqué une fois le compte créé et vérifié, `inviteTokenHash` jamais exposé). Pas encore de suite de tests automatisés committée (`vitest`/`jest` non installés côté backend) — à ajouter en même temps que le rebranchement du frontend sur cette API. La spec Swagger a été vérifiée en démarrant le serveur et en interrogeant `/api-docs.json` (25 chemins générés, tous les schémas présents) et `/api-docs` (rendu HTML de swagger-ui confirmé).

## À venir

- Rebrancher le reste du frontend (`frontend/src/lib/stores/*.js`) sur cette API à la place du mock `localStorage` — les méthodes des stores ont été conçues en miroir des endpoints ci-dessus pour rendre ce rebranchement direct. Les pages `/verify-email` et `/reset-password` sont déjà branchées sur la vraie API (voir `frontend/README.md`) ; le reste (recettes, cookbooks, planning...) tourne encore sur le mock. L'UI d'invitation de cookbook (`cookbook-detail-page.jsx`) reste également mock, pas encore branchée sur `POST /cookbooks/:id/members`.
- OAuth2 Google/GitHub réel (Passport, déjà en dépendance).
- Socket.io pour la messagerie en temps réel.
- Upload d'images via `multer` (actuellement data URL base64 stockées en base).
- SMS pour les invitations de cookbook : écarté volontairement (tout fournisseur fiable est payant), email uniquement pour l'instant.
- Configuration SMTP réelle en production (actuellement simulée en dev).
- Docker (`dockerfile` et `docker-compose.yaml` encore vides).
