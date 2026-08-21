# SUPMEAL  Backend

API REST du backend SUPMEAL. Node.js + Express 5 + Prisma + PostgreSQL, authentification locale par JWT (cookie httpOnly).

## Stack

- **Express 5** pour l'API REST
- **Prisma + PostgreSQL** pour la persistance (`prisma/schema.prisma`)
- **JWT** (`jsonwebtoken`) transmis via un **cookie httpOnly** (pas de token en `localStorage` côté client  protège contre le vol de token par XSS), `cookie-parser` pour le lire
- **bcryptjs** pour le hash des mots de passe
- **express-validator** pour la validation des requêtes (y compris une politique de robustesse sur les mots de passe, voir section Sécurité)
- **express-rate-limit** pour limiter les tentatives sur les endpoints d'authentification sensibles
- **helmet**, **cors** (avec `credentials: true`) pour la sécurité de base, protection **CSRF** en double-submit cookie sur toutes les routes authentifiées mutantes
- **morgan** pour les logs de requêtes en dev
- **nodemailer** pour l'envoi des emails de vérification/réinitialisation (voir section dédiée ci-dessous)
- **multer** pour l'upload d'images de recette (stockage disque, voir section dédiée ci-dessous)
- **socket.io** pour la messagerie de cookbook en temps réel (voir section dédiée ci-dessous)
- **swagger-jsdoc + swagger-ui-express** pour la documentation interactive de l'API (voir section dédiée ci-dessous)
- **OAuth2 Google/GitHub réel** (`fetch` natif, sans librairie tierce — voir section dédiée ci-dessous)

## Lancer le projet

```bash
npm install
npm run prisma:migrate:dev   # applique le schéma à la base (première fois / après modification du schéma)
npm run dev                   # démarre avec nodemon sur http://localhost:4000
```

Copier `.env.example` vers `.env` et renseigner `DATABASE_URL` (Postgres) + les autres variables avant de lancer.

Autres scripts : `npm start` (production, sans nodemon), `npm run prisma:generate`, `npm run prisma:studio` (explorateur de données).

Documentation interactive de l'API une fois le serveur lancé : http://localhost:4000/api-docs (spec brute en JSON : `/api-docs.json`).

### Alternative : Docker

```bash
docker compose up -d --build   # depuis la racine du dépôt (docker-compose.yaml)
```

Lance 3 services (`db` Postgres, `backend`, `frontend` servi par nginx) sur les mêmes ports que le mode `npm run dev` (4000/5173) — `backend/.env` doit exister au préalable (`env_file`, jamais copié dans l'image). Voir `SUIVI_PROJET.md` pour le détail (migrations appliquées automatiquement au démarrage du conteneur, rotation des logs plafonnée, port Postgres publié en 5433 pour éviter un conflit avec un Postgres natif déjà installé).

## Variables d'environnement (`.env`)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `NODE_ENV` | `development` / `production`  influence les options du cookie JWT (`secure`, `sameSite`) |
| `PORT` | Port d'écoute de l'API (défaut 4000) |
| `JWT_SECRET` | Secret de signature des JWT  à générer aléatoirement, jamais commité |
| `COOKIE_NAME` | Nom du cookie contenant le JWT |
| `CORS_ORIGIN` | Origine(s) autorisée(s) en CORS, séparées par des virgules (ex. `http://localhost:5173,http://localhost:5174`  le port Vite varie selon disponibilité) |
| `FRONTEND_URL` | Origine du frontend, utilisée pour construire les liens envoyés par email (`/verify-email?token=...`, `/reset-password?token=...`) et les redirections OAuth2 (succès/erreur) |
| `BACKEND_URL` | Origine de l'API elle-même, utilisée pour construire les URLs d'images uploadées et les `redirect_uri` OAuth2 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Configuration SMTP pour l'envoi réel des emails. **Optionnel** : si `SMTP_HOST` est vide, `utils/mailer.js` simule l'envoi et logge le lien dans la console au lieu d'envoyer un vrai email (pratique en dev sans compte mail) |
| `MAIL_FROM` | Adresse d'expéditeur affichée sur les emails envoyés |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Identifiants OAuth2. **Optionnel** : si absents pour un fournisseur, le bouton correspondant redirige vers le frontend avec `oauthError=not_configured` au lieu de planter |

## Structure

```
backend/
  index.js            point d'entrée : dotenv + http.createServer(app) + Socket.io + server.listen
  app.js               construction de l'app Express (helmet, cors, cookie-parser, routers, error handler)
  prisma/
    schema.prisma        modèle de données complet (User, Recipe, Ingredient, Step, Cookbook, CookbookMember,
                          PlanningEntry, Comment, Message, MessageReceipt, VerificationToken, OAuthAccount)
    migrations/            historique des migrations Prisma
  utils/
    prisma.js              instance PrismaClient singleton
    password.js              hash/compare bcrypt
    jwt.js                    sign/verify JWT + options de cookie
    tokens.js                  génération de tokens de vérification/reset (aléatoires, stockés hashés en
                                DB via sha256  jamais en clair), durées de validité (24h / 1h)
    mailer.js                   envoi des emails via nodemailer (ou simulation loggée si SMTP absent)
    permissions.js             port exact de frontend/src/lib/cookbook-permissions.js  LA source de vérité
                                pour les droits sur un cookbook, appliquée ici côté serveur (pas seulement UI)
    recipeAccess.js             résout l'accès à une recette (propriétaire OU membre du cookbook auquel
                                elle est rattachée) et le droit de la commenter, réutilisé par les recettes
                                et les commentaires
    serializers.js               formes de réponse JSON (toSafeUser masque le hash de mot de passe, etc.)
    swagger.js                    définition OpenAPI (schémas, sécurité cookie) + agrégation des annotations
                                  JSDoc `@swagger` présentes dans routes/*.routes.js, servie sur /api-docs
    AppError.js / asyncHandler.js   utilitaires d'erreurs/async
    socket.js                    Socket.io : authentification de la connexion, rooms par cookbook, diffusion des messages
    uploadFiles.js               suppression sur disque des images de recette devenues orphelines
    corsOrigins.js                liste des origines CORS, partagée entre app.js et socket.js
    oauthProviders.js             config Google/GitHub (URLs, scope, échange de code, récupération du profil)
    oauthFlow.js                  cookie temporaire portant le state anti-CSRF + l'intention (login/link) du flux OAuth2
    textMatch.js                  normalisation texte (accents/casse) pour les suggestions de recettes
    preferences.js                 libellés régimes/cuisines/allergènes, miroir de lib/constants/preferences.js côté frontend
  middleware/
    auth.js                 requireAuth : lit le cookie, vérifie le JWT, attache req.user = { id }
    loadCookbook.js           charge un cookbook + calcule le rôle de l'utilisateur courant (req.cookbook, req.role)
    validate.js                exécute express-validator, 400 + détail des erreurs si échec
    errorHandler.js             middleware d'erreur centralisé (AppError, codes Prisma, JWT, 500 générique)
  routes/ controllers/ services/   un trio par domaine (auth, users, recipes, cookbooks, planning, comments,
                                    messages)  routes définissent les endpoints + validation, controllers
                                    gèrent req/res, services contiennent la logique métier + les appels Prisma ;
                                    oauth.controller.js/oauth.service.js suivent le même découpage pour OAuth2
```

## Modèle de permissions (appliqué côté serveur)

Un cookbook a un créateur (`Cookbook.ownerId`, rôle implicite `"creator"`) et des membres (`CookbookMember`, rôle `editor`/`commentator`/`reader`), identifiés par email pour permettre des invitations "en attente" (`userId: null` tant que l'email ne correspond à aucun compte). `utils/permissions.js` calcule le rôle effectif d'un utilisateur sur un cookbook et expose les prédicats `canManageCookbook` (créateur uniquement), `canEditRecipes` (créateur/éditeur) et `canComment` (créateur/éditeur/commentateur, pas lecteur)  utilisés par `middleware/loadCookbook.js` et les contrôleurs pour autoriser chaque action.

**Convention 404 vs 403** : un utilisateur sans aucun rôle sur un cookbook (ou sans accès à une recette) reçoit systématiquement un `404` (la ressource "n'existe pas" pour lui) plutôt qu'un `403`, qui révélerait son existence. Le `403` est réservé aux utilisateurs qui ont un rôle mais des droits insuffisants pour l'action demandée.

Le champ `Recipe.cookbookId` ne peut **pas** être modifié via le `PATCH /recipes/:id` générique (uniquement réservé au propriétaire de la recette)  il faut passer par `POST/DELETE /cookbooks/:id/recipes/:recipeId`, qui vérifie en plus les droits d'édition sur le cookbook cible. Cela évite qu'un propriétaire de recette rattache sa recette à un cookbook dont il n'est pas membre éditeur/créateur.

### Invitation par lien sécurisé

`POST /cookbooks/:id/members` (`email`, `role`) se comporte différemment selon que l'email correspond déjà à un compte :

- **Compte existant** : rattachement immédiat (`CookbookMember.userId` renseigné), un simple email de notification est envoyé (pas de lien à cliquer, la personne peut déjà se connecter).
- **Pas de compte** : un token aléatoire à usage unique (`crypto.randomBytes(32)`, stocké hashé en sha256 dans `CookbookMember.inviteTokenHash`, jamais en clair) est généré, valable **7 jours**, et envoyé par email sous forme de lien `${FRONTEND_URL}/register?inviteToken=...`. `POST /auth/register` accepte un champ `inviteToken` optionnel : s'il correspond à une invitation valide et non expirée, le `CookbookMember` correspondant est automatiquement rattaché au nouveau compte (`userId`, `email`, `name` mis à jour, token supprimé  usage unique). Un token invalide, expiré ou déjà utilisé est **ignoré silencieusement** : il ne bloque jamais la création du compte.

Les réponses API sur les cookbooks/membres passent systématiquement par `toCookbookDTO`/`toCookbookMemberDTO` (`utils/serializers.js`), qui excluent `inviteTokenHash`/`inviteTokenExpiresAt`  le hash du token n'est jamais renvoyé au client, même si sa fuite ne permettrait pas de retrouver le token d'origine (hash à sens unique).

**SMS non implémenté** : envisagé un temps, mais tout fournisseur SMS fiable (Twilio et équivalents) est un service payant  écarté volontairement pour ce projet. L'invitation ne se fait donc que par email.

## Vérification d'email et réinitialisation de mot de passe

- `POST /auth/register` crée le compte (`emailVerified: false`) et envoie un email de vérification, **mais ne pose pas de cookie**  l'inscription ne connecte plus automatiquement l'utilisateur, contrairement à avant. `POST /auth/login` refuse la connexion avec `403` tant que `emailVerified` est `false`.
- Les tokens (vérification d'email et réinitialisation de mot de passe) sont générés côté serveur avec `crypto.randomBytes(32)`, envoyés en clair par email, mais **stockés hashés (sha256)** en base dans `VerificationToken.tokenHash`  un accès en lecture à la base ne permet donc pas de rejouer un lien envoyé. Chaque token est à usage unique (supprimé après consommation) et une nouvelle demande invalide toute demande précédente du même type pour cet utilisateur.
- Durées de validité : **24h** pour la vérification d'email, **1h** pour la réinitialisation de mot de passe (plus court car ce token permet de changer le mot de passe, action plus sensible).
- `POST /auth/resend-verification` et `POST /auth/forgot-password` renvoient toujours une réponse **générique identique**, que l'email corresponde à un compte ou non  évite qu'un attaquant énumère les comptes existants via ces endpoints.
- Sans configuration SMTP (`SMTP_HOST` absent), `utils/mailer.js` ne part pas réellement : le lien est loggé dans la console du serveur (`[mailer] SMTP non configuré...`), pratique pour tester en local sans compte mail.
- **Nettoyage automatique** (`utils/tokenCleanup.js`) : une tâche démarrée avec le serveur (exécutée immédiatement puis toutes les heures) supprime les `VerificationToken` expirés (email de vérification / reset jamais utilisés) et vide les champs `inviteTokenHash`/`inviteTokenExpiresAt` des invitations de cookbook expirées (la ligne `CookbookMember` elle-même est conservée, seul le jeton est purgé). Un token expiré est déjà rejeté fonctionnellement par `consumeToken`/`consumeCookbookInvite` avant ce nettoyage  il s'agit d'hygiène des données, pas d'une protection supplémentaire.

## Sécurité

- **Rate limiting** (`middleware/rateLimit.js`, basé sur `express-rate-limit`) : `POST /auth/login` limité à 10 tentatives / 15 min / IP (429 au-delà) ; `POST /auth/register`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password` limités de la même façon (protège contre le brute force sur le mot de passe et le spam d'envoi d'emails).
- **Mots de passe** : politique de robustesse appliquée via `express-validator#isStrongPassword` sur l'inscription, la réinitialisation et le changement de mot de passe  8 caractères minimum, au moins une majuscule, une minuscule, un chiffre et un caractère spécial (`utils/passwordPolicy.js`, règle centralisée pour rester cohérente sur les 3 endpoints, et reflétée côté frontend dans `frontend/src/lib/password-strength.js`).
- **CSRF** (`middleware/csrf.js`, pattern *double-submit cookie*) : en production, le cookie de session est posé en `sameSite: "none"` (frontend et backend sur des origines différentes), ce qui désactive la protection CSRF native de `sameSite: "lax"`. Un second cookie non-`httpOnly` (`supmeal_csrf`) est posé à la connexion ; le frontend le recopie dans l'en-tête `X-CSRF-Token` sur toute requête mutante (voir `frontend/src/lib/api.js`). Toute requête `POST/PATCH/PUT/DELETE` sur une route authentifiée sans en-tête correspondant au cookie est rejetée en `403`. Les routes publiques (`/auth/register`, `/auth/login`, ...) ne sont pas concernées puisqu'aucune session n'existe encore à ce stade.
- **Autorisation des membres de cookbook** : `PATCH/DELETE /cookbooks/:id/members/:memberId` vérifie que le membre ciblé appartient bien au cookbook `:id` (et pas seulement que l'appelant est propriétaire d'*un* cookbook) avant de modifier son rôle ou de le retirer  sinon `404`.
- **Révocation des JWT** : `User.tokenVersion` (incrémenté à chaque changement/réinitialisation de mot de passe) est embarqué dans le payload du JWT et revérifié en base à chaque requête authentifiée (`middleware/auth.js`). Un JWT signé avant un changement de mot de passe devient donc invalide immédiatement (`401`), sans attendre son expiration (7 jours)  utile si le token a fuité ou si une autre session doit être coupée. La session qui effectue elle-même le changement (`PATCH /users/me/password`) reçoit un cookie réémis avec le nouveau `tokenVersion`, donc n'est pas déconnectée par sa propre action ; `POST /auth/reset-password` (flux mot de passe oublié) n'a pas de session active à réémettre, toutes les sessions existantes sont donc invalidées.
- **Secrets** : `.env` n'est jamais committé (`.gitignore`), voir `.env.example` pour la liste des variables attendues. Un `backend/.env` avait été committé puis supprimé tôt dans le projet  le mot de passe Postgres natif exposé a depuis été changé, et l'historique Git a été réécrit (`git filter-repo` + force-push, 2026-08-21) pour ne plus l'exposer du tout.

## OAuth2 (Google/GitHub)

Flux "authorization code" implémenté à la main avec le `fetch` natif de Node (`utils/oauthProviders.js`) plutôt qu'avec Passport (dépendances `passport`/`passport-google-oauth20`/`passport-github2` retirées du projet) : Passport gère nativement l'anti-CSRF de ce flux via `req.session`, ce qui aurait imposé d'introduire `express-session` dans une API par ailleurs entièrement stateless (JWT en cookie httpOnly) — cohérence architecturale plutôt qu'économie de code.

- **Anti-CSRF sans session serveur** (`utils/oauthFlow.js`) : au départ du flux, un `state` aléatoire est généré et embarqué (avec l'intention et, pour "link", l'id de l'utilisateur courant) dans un cookie httpOnly de courte durée (`supmeal_oauth_flow`, 10 min). Au retour du fournisseur, le `state` reçu en query param est comparé à celui du cookie ; toute divergence (falsification, cookie expiré, callback rejoué) redirige vers une erreur (`oauthError=state_mismatch`) sans jamais toucher la base.
- **Deux intentions, un seul callback** : `GET /auth/oauth/:provider` (public) démarre une connexion/inscription ; `GET /auth/oauth/:provider/link` (authentifié) démarre un rattachement au compte déjà connecté. `GET /auth/oauth/:provider/callback` (appelé par le fournisseur, jamais par le client) lit l'intention dans le cookie de flux pour savoir quoi faire du profil récupéré.
- **Connexion/inscription** (`services/oauth.service.js#findOrCreateUserFromProfile`) : si ce compte tiers est déjà lié, reconnexion directe. Sinon, si l'email du profil correspond à un compte SUPMEAL existant, rattachement automatique (le fournisseur a déjà vérifié cet email, aucun risque de prise de contrôle d'un compte qu'on ne possède pas). Sinon, création d'un compte avec `emailVerified: true` d'office (skip du flux de vérification par email) et `hasPassword: false` — `passwordHash` contient un secret aléatoire (`crypto.randomBytes(32)`) jamais communiqué, qui rend `POST /auth/login` classique impossible tant qu'aucun vrai mot de passe n'a été défini via `POST /auth/reset-password` ("mot de passe oublié" fonctionne indépendamment de `hasPassword`).
- **Liaison depuis Paramètres > Connexions** (`linkAccountToUser`) : refuse (`409`) si ce compte tiers est déjà lié à un *autre* utilisateur SUPMEAL. `DELETE /users/me/oauth/:provider` (délier) refuse (`400`) de retirer le dernier moyen de connexion (`hasPassword: false` et aucun autre fournisseur lié) pour ne jamais verrouiller un utilisateur hors de son propre compte.
- **Modèle** : `OAuthAccount` (`provider`, `providerAccountId`, `userId`), `@@unique([provider, providerAccountId])` (un compte tiers ne peut être lié qu'à un seul utilisateur SUPMEAL) et `@@unique([provider, userId])` (un utilisateur ne peut lier qu'un seul compte par fournisseur).
- **Configuration** : applications OAuth créées sur Google Cloud Console et GitHub Developer Settings, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` renseignés avec de vrais identifiants en `.env` (URIs de redirection déclarées côté fournisseur : `{BACKEND_URL}/auth/oauth/google/callback` et `{BACKEND_URL}/auth/oauth/github/callback`). Si l'un de ces identifiants venait à manquer, le bouton correspondant redirigerait proprement vers le frontend avec `oauthError=not_configured` au lieu de planter.
- **Vérifié** (script Node dédié, nettoyé après coup) : rattachement automatique à un compte existant par email, absence de doublon en rejouant le même profil, création d'un nouveau compte avec `hasPassword: false`, refus de lier un compte tiers déjà lié à un autre utilisateur (409), refus/autorisation de délier selon `hasPassword` et le nombre de fournisseurs restants (12/12 assertions) ; côté HTTP, fournisseur inconnu, `401` sur `/link` sans session, `state_mismatch` sans cookie de flux ou avec un `state` altéré, `access_denied` sur refus du fournisseur, et redirection réelle vers l'écran de consentement Google avec les bons paramètres. **Confirmé aussi en navigateur réel** avec un vrai compte Google et un vrai compte GitHub (connexion de bout en bout, redirection vers `/recipes`, connexion visible dans Paramètres > Connexions).

## Documentation interactive (Swagger)

La spec OpenAPI 3 est générée à partir d'annotations JSDoc `@swagger` directement dans `routes/*.routes.js` (une annotation par endpoint, à côté de la définition de la route  pas de fichier séparé à maintenir en double). `utils/swagger.js` définit le socle (info, tags, schémas de `components.schemas` calqués sur les DTO de `utils/serializers.js`, schéma de sécurité `cookieAuth`) et agrège ces annotations via `swagger-jsdoc`.

- **UI interactive** : `GET /api-docs` (swagger-ui-express)  permet de tester les endpoints directement depuis le navigateur ("Try it out"). Le cookie de session posé par `POST /auth/login` sur le même domaine est automatiquement envoyé par le navigateur, donc les routes protégées fonctionnent une fois connecté via l'UI.
- **Spec brute** : `GET /api-docs.json`  utilisable pour générer un client, l'importer dans Postman/Insomnia, etc.
- Le header CSP posé par `helmet` est désactivé uniquement sur `/api-docs` (nécessaire au rendu de swagger-ui, qui utilise du JS/CSS inline)  inchangé sur le reste de l'API.
- Chaque endpoint documente sa méthode/paramètres/corps de requête, ses réponses possibles (avec les codes 400/401/403/404 pertinents référençant `components.responses`), et son tag de domaine (Auth, Users, Recipes, Cookbooks, Planning, Comments, Messages).

## Endpoints

| Domaine | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/oauth/:provider`, `GET /auth/oauth/:provider/link`, `GET /auth/oauth/:provider/callback` |
| Users | `PATCH /users/me`, `PATCH /users/me/password`, `PATCH /users/me/preferences`, `DELETE /users/me/oauth/:provider` |
| Recettes | `GET/POST /recipes` (filtres `q`, `tags`, `time`, `favorite`), `GET /recipes/suggestions` (filtre `ingredients`, `limit`), `GET/PATCH/DELETE /recipes/:id`, `PATCH /recipes/:id/favorite` |
| Cookbooks | `GET/POST /cookbooks`, `GET/PATCH/DELETE /cookbooks/:id`, `GET /cookbooks/:id/recipes`, `POST/DELETE /cookbooks/:id/recipes/:recipeId`, `POST /cookbooks/:id/members`, `PATCH/DELETE /cookbooks/:id/members/:memberId` |
| Planning | `PUT /planning` (upsert sur `ownerId+date+mealSlot`), `GET /planning?from=&to=`, `DELETE /planning/:id` |
| Commentaires | `GET/POST /recipes/:id/comments`, `DELETE /comments/:commentId` |
| Messages | `GET/POST /cookbooks/:id/messages` |
| Uploads | `POST /uploads/images` (multipart, retourne des URLs), `GET /uploads/:fichier` (statique, public) |

## Upload d'images (`middleware/upload.js`, `utils/uploadFiles.js`)

- Les images de recette ne sont plus stockées en data URL base64 dans `Recipe.images` : le frontend envoie les fichiers à `POST /uploads/images` (`multipart/form-data`, champ `images`, jusqu'à 10 fichiers, 2 Mo max chacun, jpeg/png/webp/gif uniquement  `multer` avec stockage disque dans `backend/uploads/`, non committé), qui répond avec des URLs absolues (`${BACKEND_URL}/uploads/<fichier>.<ext>`) à réutiliser telles quelles dans le corps de `POST/PATCH /recipes/:id`.
- **Nom de fichier jamais dérivé de l'entrée utilisateur** : généré côté serveur (`crypto.randomBytes`), extension dérivée du *mimetype détecté par multer* (pas du nom de fichier fourni par le client)  évite qu'un fichier malveillant se fasse passer pour une image via une extension trompeuse.
- **Lecture publique, écriture authentifiée** : `GET /uploads/:fichier` (servi par `express.static`) ne demande pas de session  comportement standard pour des photos de recette destinées à être affichées/partagées  alors que `POST /uploads/images` exige une session valide et le jeton CSRF, comme le reste des routes mutantes.
- **Pas de fichiers orphelins** : `recipes.service.js` supprime du disque les images retirées d'une recette lors d'un `PATCH` (diff entre l'ancien et le nouveau tableau `images`) et toutes les images d'une recette lors d'un `DELETE`. Limite connue : une image uploadée puis retirée *avant même la création de la recette* (nouvelle recette jamais soumise) reste orpheline sur le disque  non traité pour l'instant (volume attendu négligeable pour ce projet).
- Les anciennes recettes créées avant ce changement gardent leurs data URL base64 en base  elles continuent de s'afficher normalement (`<img src>` accepte les deux formats), aucune migration nécessaire.

## Recherche plein texte (`GET /recipes?q=`)

- `Recipe.searchVector` : colonne `tsvector` **générée par Postgres** (`GENERATED ALWAYS AS (...) STORED`, migration `add_recipe_search_vector`) à partir du titre, des tags et de la source, indexée en **GIN**  remplace le filtrage en mémoire sur l'ensemble des recettes du propriétaire qui existait auparavant (`recipes.service.js#matchesQuery`, supprimé).
- `to_tsvector('french', ...)` ne peut pas être utilisé directement dans l'expression d'une colonne générée (Postgres refuse : la conversion du texte `'french'` en `regconfig` dépend du catalogue `pg_ts_config`, donc jugée non-immuable  erreur `42P17`). Contournement standard : une fonction SQL `recipe_search_text(title, tags, source)` marquée `IMMUTABLE` qui encapsule l'appel, config figée en dur dans son corps.
- `recipes.service.js#findMatchingRecipeIds` combine `searchVector @@ plainto_tsquery('french', q)` (correspondance par mot/racine, accents inclus) avec des `ILIKE` en complément : sur le titre/la source/les tags pour les recherches par sous-chaîne partielle (ex. `"tomat"`, qu'un tsquery ne détecte pas) et sur `Ingredient.name` (table séparée, non couverte par la colonne générée du côté `Recipe`). Les ids obtenus filtrent ensuite la requête Prisma normale (`where: { id: { in: ... } }`), qui applique le reste des filtres (`tags`, `favorite`) et l'`include` habituel.
- Le filtrage côté frontend (`recipes-page.jsx`) reste néanmoins la méthode utilisée aujourd'hui par l'UI (choix assumé pour ce volume de données, voir `docs/choix-techniques.md`)  cet endpoint expose la capacité serveur, prête à être branchée si le volume le justifie un jour.
- Vérifié via un script Node dédié (13 assertions) : recherche par titre, par sous-chaîne partielle, par tag, par ingrédient, par source, requête sans résultat, absence de `q` renvoyant tout.

## Suggestions intelligentes de recettes (`GET /recipes/suggestions`)

- `services/recipes.service.js#suggestForUser` classe les recettes de l'utilisateur connecté (hors recettes déjà en favori — déjà identifiées, l'intérêt est la découverte) selon un score cumulatif : régime alimentaire du profil (+3 si un tag/le titre correspond au libellé du régime, ex. "Végétarien"), cuisine préférée (+2), nouveauté par rapport au planning (+2 si la recette n'a jamais été planifiée, -2 si planifiée dans les 14 derniers jours), affinité de tags avec les recettes déjà en favori (+1 par occurrence de tag partagé, plafonné à +4), et optionnellement les ingrédients que l'utilisateur indique avoir sous la main (paramètre `ingredients`, jusqu'à +5 selon la proportion d'ingrédients de la recette effectivement disponibles).
- **Les allergies déclarées excluent, elles ne pénalisent pas** : toute recette dont le titre, les tags ou un nom d'ingrédient contient un allergène de `User.allergies` est retirée de la liste avant le tri — la sécurité alimentaire prime sur le classement.
- Comparaison insensible à la casse et aux accents (`utils/textMatch.js#normalizeText`, `String.normalize("NFD")` + suppression des marques diacritiques) : les tags sont du texte libre saisi par l'utilisateur (pas de vocabulaire contrôlé), donc "Végétarien" et "vegetarien" doivent être reconnus comme identiques. Les libellés de référence (régimes/cuisines/allergènes) sont dupliqués côté serveur dans `utils/preferences.js`, miroir de `frontend/src/lib/constants/preferences.js`.
- La réponse inclut un tableau `reasons` par recette (ex. `"Correspond à votre régime (Végétarien)"`, `"Vous ne l'avez jamais planifiée"`) — affiché tel quel côté frontend sous forme de badges, pour que la suggestion reste explicable plutôt qu'une boîte noire.
- Vérifié via un script Node dédié (15 assertions) : exclusion d'une recette contenant un allergène déclaré, exclusion des recettes déjà en favori, bonus régime/cuisine avec raisons associées, recette jamais planifiée mieux classée qu'une recette planifiée récemment, bonus d'affinité de tags avec les favoris, filtrage par ingrédients disponibles avec raison associée, troncature correcte via `limit`.

## Messagerie en temps réel (`utils/socket.js`)

- La messagerie de cookbook (`POST /cookbooks/:id/messages`) reste un endpoint REST classique (persistance, retour immédiat à l'auteur), mais diffuse désormais aussi le message via **Socket.io** à tous les membres actuellement connectés à ce cookbook  plus besoin de recharger la page pour voir un message d'un autre utilisateur.
- **`index.js`** attache Socket.io au serveur HTTP brut (`http.createServer(app)`, requis par Socket.io pour gérer l'upgrade WebSocket  `app.listen()` seul ne suffit pas), avec le même `CORS_ORIGIN` que l'API REST (`utils/corsOrigins.js`, partagé avec `app.js` pour n'avoir qu'une seule liste d'origines à maintenir).
- **Authentification de la connexion** (`io.use(authenticate)`) : le cookie de session est lu manuellement depuis les en-têtes de la poignée de main (`socket.handshake.headers.cookie`  pas de `cookie-parser` disponible ici), puis vérifié exactement comme `middleware/auth.js` (JWT + `tokenVersion`, voir section Sécurité)  une connexion sans cookie valide est immédiatement rejetée (`connect_error`).
- **Rooms par cookbook, jamais globales** : un client ne rejoint `cookbook:<id>` (`socket.emit("cookbook:join", id)`) que si le serveur lui reconnaît un rôle sur ce cookbook (`getCookbookRole`, même garde-fou que `loadCookbookAndRole` côté REST)  sinon la demande est silencieusement ignorée, un utilisateur connecté ne peut donc pas écouter les messages d'un cookbook auquel il n'appartient pas en devinant son id.
- **Commentaires de recette en temps réel** : même principe qu'au-dessus mais par recette (`recipe:<id>`, `socket:join`/`recipe:leave`), avec le garde-fou `resolveRecipeAccess` (`utils/recipeAccess.js`)  déjà utilisé par `GET /recipes/:id`, donc un membre de cookbook voit les commentaires en direct exactement comme le propriétaire, et un tiers sans accès ne peut pas rejoindre la room. `POST /recipes/:id/comments`/`DELETE /comments/:commentId` restent des endpoints REST classiques (persistance, réponse immédiate à l'auteur) qui diffusent en plus `comment:new`/`comment:deleted` à la room  plus besoin de recharger la page pour voir le commentaire d'un autre utilisateur. Vérifié via un script Node dédié avec de vrais clients `socket.io-client` (12 assertions : propriétaire et membre de cookbook reçoivent les deux events, un tiers sans accès ne reçoit jamais rien même après un nouveau `recipe:join`).
- Le frontend gère lui-même la déduplication (le message posté par son propre auteur arrive à la fois via la réponse HTTP du `POST` et via la rediffusion Socket.io à toute la room, lui y compris).
- **Stickers/images dans le chat** : `Message.imageUrl` (nullable), `text` a désormais un défaut `""` (message uniquement composé d'un sticker). Un message doit contenir au moins l'un des deux (`text` ou `imageUrl`), validé par un `body().custom(...)` dans `routes/messages.routes.js`  sinon `400`. Le sticker passe par le même endpoint d'upload que les images de recette (`POST /uploads/images`), aucune route dédiée : le frontend uploade d'abord le fichier, puis poste le message avec l'URL renvoyée.
- Vérifié via 2 scripts Node dédiés : messagerie temps réel (client `socket.io-client`, 8 assertions  connexion sans cookie rejetée, un membre du cookbook reçoit le message en temps réel, un utilisateur jamais invité n'en reçoit aucun) et texte/sticker (4 assertions  message sans texte ni image refusé, texte seul, image seule, cohérence de la liste).

### Présence en ligne (`User.lastSeenAt`, `utils/socket.js`)

- Un `Map<userId, Set<socketId>>` en mémoire (`onlineUsers`) suit les connexions actives  un utilisateur avec plusieurs onglets/appareils ouverts reste "en ligne" tant qu'au moins une socket est connectée, il ne redevient hors ligne qu'à la fermeture de la **dernière**.
- À la déconnexion de la dernière socket d'un utilisateur (event `disconnecting`, choisi plutôt que `disconnect` car `socket.rooms` est encore renseigné à ce moment), `User.lastSeenAt` est mis à jour en base et un `presence:update` (`{ userId, online: false, lastSeenAt }`) est diffusé à toutes les rooms de cookbook où il était présent.
- À la connexion/`cookbook:join`, l'appelant reçoit un **snapshot** complet de la présence des membres du cookbook via un callback d'acknowledgement Socket.io (`socket.emit("cookbook:join", id, (snapshot) => ...)`)  en ligne pour les utilisateurs actuellement connectés, `lastSeenAt` (potentiellement `null` si jamais vu) sinon. Les autres membres déjà présents dans la room reçoivent un `presence:update` (`online: true`) annonçant l'arrivée.
- Vérifié via un script Node dédié (6 assertions) : snapshot initial correct, notification temps réel à la connexion/déconnexion, **non-régression multi-onglets** (fermer un onglet sur deux ne déclenche pas le passage hors ligne), persistance de `lastSeenAt` en base.

### Accusés de réception et "en train d'écrire"

- **`Message.delivered`/`Message.read`** (calculés, pas stockés directement  voir `MessageReceipt` et `utils/serializers.js#toMessageDTO`) : deux coches façon messagerie instantanée. Un message est **livré** dès qu'**au moins un** autre membre du cookbook l'a reçu côté client (fetch initial ou event `message:new`) ; **lu** dès qu'au moins un autre membre l'avait à l'écran avec son onglet visible (Page Visibility API côté client). "Au moins un" plutôt que "tous les membres", plus simple à raisonner pour un chat de groupe à effectif variable.
- **`MessageReceipt`** (une ligne par `(message, destinataire)`, jamais pour l'auteur lui-même) : `deliveredAt` posé au premier `cookbook:delivered`, `readAt` posé par `cookbook:seen`. Les deux events sont reçus par `utils/socket.js`, qui délègue à `messages.service.js#markReceipts` puis rediffuse l'agrégat (`getAggregateReceipts`) à toute la room via `receipts:update`  le frontend n'a donc jamais besoin de refetch pour voir les coches se mettre à jour.
- **Garde-fou allégé** : contrairement à `cookbook:join` (qui revérifie le rôle en base), `cookbook:delivered`/`cookbook:seen`/`cookbook:typing` se contentent de vérifier que la socket a déjà rejoint la room (`socket.rooms.has(...)`)  rejoindre exige déjà d'avoir passé la vérification de rôle une fois, pas besoin de la refaire à chaque frappe/accusé de réception.
- **"En train d'écrire"** (`cookbook:typing` → `typing:update`) : purement éphémère, aucune trace en base, simple relais aux autres membres de la room.
- Vérifié via un script Node dédié (8 assertions) : état initial (aucune coche), passage livré puis lu avec diffusion temps réel, cohérence avec `GET /cookbooks/:id/messages`, aucun accusé créé pour l'auteur sur son propre message, indicateur de frappe (activation/désactivation), et rejet silencieux d'un `cookbook:typing` envoyé par une socket n'ayant jamais rejoint la room.

## Vérification

Toutes les routes ont été testées via des scripts Node (`fetch` + assertions) simulant plusieurs comptes (créateur/éditeur/lecteur/étranger) : CRUD complet, filtres de recherche, upsert de planning, et surtout les cas de permissions (accès refusé, tentative de contournement des droits de cookbook via le PATCH générique, visibilité 404 vs 403). Le flux de vérification d'email et de réinitialisation de mot de passe est couvert par 24 assertions dédiées (token invalide/expiré/réutilisé, blocage du login tant que l'email n'est pas vérifié, réponse anti-énumération sur forgot-password). Le flux d'invitation par lien sécurisé est couvert par 32 assertions dédiées (compte existant vs invitation en attente, token invalide/déjà consommé qui n'empêche jamais l'inscription, rôle correctement appliqué une fois le compte créé et vérifié, `inviteTokenHash` jamais exposé). Le durcissement sécurité (IDOR cookbook, CSRF, rate limiting, rotation JWT, validation PATCH) est couvert par 29 assertions dédiées. Les suggestions intelligentes de recettes sont couvertes par 15 assertions dédiées (exclusion allergène, exclusion favoris, bonus régime/cuisine/nouveauté/affinité de tags, filtrage par ingrédients disponibles, troncature `limit`). L'upload d'images est couvert par 14 assertions dédiées (auth/CSRF requis, type de fichier refusé, fichier bien servi publiquement, nettoyage disque au retrait/à la suppression d'une recette). La messagerie temps réel (Socket.io) est couverte par 8 assertions, la présence en ligne par 6, les accusés de réception/indicateur de frappe par 8, les commentaires de recette en temps réel par 12, la recherche plein texte par 13, et l'OAuth2 Google/GitHub par 12 (voir chaque section dédiée pour le détail). Choix assumé de ne pas committer de suite de tests automatisés (`vitest`/`jest`) côté backend — même choix que côté frontend (infrastructure `vitest` installée mais aucun fichier de test, voir `frontend/README.md`) : la vérification par scripts Node jetables, contre une vraie base de données plutôt que des mocks, à chaque fonctionnalité livrée, est la méthode retenue pour ce projet. La spec Swagger a été vérifiée en démarrant le serveur et en interrogeant `/api-docs.json` (tous les chemins générés, tous les schémas présents) et `/api-docs` (rendu HTML de swagger-ui confirmé).


