# SUPMEAL — Frontend

Client web de SUPMEAL (gestion de recettes et planification de repas). Ce client n'interroge que l'API du dossier `backend/` — aucune logique métier ne doit vivre ici.

## Stack

- **React 19** + **Vite** (build/dev server)
- **React Router DOM** pour le routing et la protection des routes
- **Tailwind CSS v4** + **shadcn/ui** (style `base-nova`, primitives [`@base-ui/react`](https://base-ui.com)) pour l'UI
- **react-hook-form** + **zod** pour la validation des formulaires
- **zustand** pour l'état global (auth, recettes, cookbooks, planning, commentaires, messages) — plus de persistance `localStorage` : chaque store reflète l'API réelle (`fetchAll`/`fetchByX` au montage, actions `async`)
- **axios** (`src/lib/api.js`, `withCredentials: true`) pour tous les appels API, cookie de session httpOnly géré automatiquement par le navigateur
- **next-themes** pour le thème clair/sombre
- **sonner** pour les notifications toast
- **react-dropzone** pour l'upload d'images par glisser-déposer (recettes)
- **embla-carousel-react** (via le composant `carousel` de shadcn) pour le carrousel d'images d'une recette
- **socket.io-client** : toujours prévu mais non branché — la messagerie/les commentaires sont en REST classique (pas de temps réel entre deux navigateurs, il faut recharger pour voir les messages d'un autre utilisateur)
- **papaparse** pour l'export/import CSV des recettes, **file-saver** pour déclencher le téléchargement des fichiers exportés
- **framer-motion** pour les animations (effet 3D au survol des cartes recettes, transitions de page, apparition échelonnée des grilles, micro-interactions) — toujours conditionnées par `useReducedMotion()`
- **vitest** installé pour les tests unitaires (`npm run test`), configuré dans `vite.config.js` — aucun fichier de test présent actuellement

## Lancer le projet

```bash
npm install
npm run dev
```

L'app est servie sur http://localhost:5173. Nécessite le backend démarré (voir `backend/README.md`) — copier `.env.example` vers `.env` si `VITE_API_URL` doit pointer ailleurs que `http://localhost:4000` (valeur par défaut si `.env` est absent).

Autres scripts : `npm run build` (build de production), `npm run preview` (prévisualiser le build), `npm run lint` (ESLint), `npm run test` (vitest — pas encore de fichier de test).

## Structure

```
src/
  components/
    ui/          composants shadcn/ui générés (button, input, sheet, dropdown-menu, carousel, alert-dialog, ...)
    layout/       sidebar, topbar, menu utilisateur, liens de navigation
    recipes/      carte recette (avec effet 3D au survol), formulaire recette, upload d'images en galerie, import/export
    cookbooks/    carte cookbook, formulaire cookbook
    *.jsx          composants partagés (page-header, empty-state, form-field, theme-toggle, tag-input, error-boundary, page-loader, motion-press)
  layouts/         layout d'authentification (écran scindé, fond animé) et layout applicatif (sidebar + topbar, transitions de page)
  routes/          garde-fous de routage (route protégée / route publique uniquement)
  hooks/           hooks partagés (use-my-recipes : aussi réutilisé par la page Favoris, use-my-cookbooks, use-my-planning, use-recipe-comments, use-cookbook-messages) — déclenchent le fetch initial sur le store zustand correspondant et exposent la donnée déjà à jour
  pages/
    auth/          connexion, inscription
    settings/       les 4 onglets de la page Paramètres (profil, sécurité, connexions, préférences)
    recipes/        création, édition, détail d'une recette (avec ses commentaires)
    cookbooks/      création, édition, détail d'un cookbook (onglets Recettes/Membres/Discussion)
    *.jsx          pages applicatives (liste des recettes, cookbooks, planning, favoris, paramètres) — routées via `React.lazy()` dans `App.jsx`
  lib/
    api.js         instance axios (`withCredentials: true`, `VITE_API_URL`) + `apiErrorMessage(error, fallback)`,
                    intercepteur de réponse : un 401 hors `/auth/*` déclenche l'event `supmeal:unauthorized`
                    (écouté par auth-store.js pour vider la session et rediriger vers /login)
    stores/        state global zustand — un store par domaine (auth-store.js, recipes-store.js, cookbooks-store.js,
                    planning-store.js, comments-store.js, messages-store.js), chacun avec un état `status`
                    (`idle`/`loading`/`loaded`/`error`) et des actions `async` qui appellent `lib/api.js`
    schemas/        schémas de validation zod (auth.js, settings.js, recipe.js, cookbook.js)
    constants/      listes de référence (régimes, cuisines, allergènes, fournisseurs OAuth2, unités, tags, rôles de cookbook, taille max image)
    cookbook-permissions.js  calcul du rôle d'un utilisateur sur un cookbook + garde-fous de permission — port exact
                              de `backend/utils/permissions.js`, utilisé côté client pour l'affichage uniquement
                              (le serveur revérifie systématiquement, voir backend/README.md)
    planning.js    utilitaires de dates (semaine, jours) et d'agrégation de quantités pour la liste de courses
    recipe-io.js   export JSON/CSV/Mealie et import (détection de format, normalisation, validation zod)
    motion-variants.js  variantes framer-motion partagées (apparition échelonnée des grilles)
    nav-items.js   liste des liens de navigation de la sidebar
    utils.js        helper `cn` (clsx + tailwind-merge)
```

## État d'avancement

Le routing, le layout applicatif (sidebar/topbar, thème clair/sombre), les pages de connexion/inscription, la page Paramètres (profil, sécurité, connexions OAuth2, préférences culinaires), la gestion des recettes (liste, création, édition, détail, favoris, jusqu'à 10 images en carrousel), la recherche/filtrage des recettes, les cookbooks partagés (création, invitation, rôles, rattachement de recettes), la page Favoris, le Planning des repas, la Messagerie/Commentaires et l'Import/Export des recettes sont en place. **Toutes les fonctionnalités sont désormais branchées sur la vraie API** (`backend/`, voir son README pour le détail des endpoints) — plus aucun store zustand ne persiste en `localStorage`, l'authentification passe par un cookie de session httpOnly. Restent en dehors du périmètre actuel : OAuth2 réel (toujours simulé côté `connections-tab.jsx`), messagerie/commentaires en temps réel (Socket.io), upload d'images serveur (`multer`, images toujours en data URL base64). Voir `SUIVI_PROJET.md` pour le détail complet.

Une première passe "niveau professionnel" (critère bonus) a aussi été faite : gestion d'erreurs, tests unitaires, découpage du bundle par route, cohérence des permissions, et polish visuel 2D/3D — voir la section dédiée ci-dessous.

### Niveau professionnel (bonus) : robustesse et polish visuel

**Robustesse / architecture / performance :**
- `components/error-boundary.jsx` (composant classe) enveloppe l'app dans `main.jsx` — écran de secours au lieu d'un écran blanc en cas d'erreur de rendu.
- `App.jsx` charge les 14 pages via `React.lazy()` + `Suspense` (`components/page-loader.jsx`) au lieu d'imports statiques : le chunk principal est passé de 797 Ko à ~320 Ko (hors framer-motion), chaque page ne chargeant que son propre code à la navigation. `App.jsx` bloque aussi le rendu des routes derrière un `bootstrap()` de session (`GET /auth/me`) tant que le statut n'est pas `ready`, pour éviter un flash de redirection vers `/login` avant de savoir si le cookie est valide.
- `loading="lazy"` sur toutes les images de recettes ; ajustements responsive ciblés sur `recipe-form.jsx` et l'en-tête de `cookbook-detail-page.jsx` ; `EmptyState` partagé partout (plus de `<p>` de secours isolés).
- Infrastructure de tests `vitest` installée et configurée (`npm run test`) ; aucun fichier de test n'est présent pour l'instant.

**Polish visuel 2D/3D (`framer-motion`) :**
- Effet 3D au survol des cartes recettes (`recipe-card.jsx`) : inclinaison `rotateX`/`rotateY` suivant le curseur + reflet.
- Pages de connexion/inscription (`layouts/auth-layout.jsx`) : formes floutées en dérive lente + parallaxe suivant le curseur, icônes culinaires décoratives flottantes, logo animé, et contenu du formulaire qui apparaît en cascade (`lib/motion-variants.js`, partagé entre `login-page.jsx` et `register-page.jsx`) avec micro-interactions sur tous les boutons (email + OAuth).
- Transitions de page (fondu + léger déplacement) dans `layouts/app-layout.jsx`, compatibles avec le lazy-loading.
- Apparition échelonnée des grilles recettes/cookbooks (`lib/motion-variants.js`) et micro-interactions sur les CTA principaux (`components/motion-press.jsx`).
- Toutes les animations respectent `prefers-reduced-motion` (`useReducedMotion()` côté framer-motion, media query CSS globale dans `index.css`).

### Import / Export des recettes

Sur `recipes-page.jsx`, `components/recipes/recipe-import-export.jsx` ajoute deux actions à côté de "Nouvelle recette" :

- **Exporter** : un `Sheet` affiche d'abord l'avertissement "données en clair" (non chiffrées), puis une liste à cocher des recettes (toutes sélectionnées par défaut, bouton "Tout sélectionner/désélectionner", compteur "x/y") pour choisir précisément lesquelles exporter, avant de proposer trois formats — **JSON** (natif, uniquement les champs portables d'une recette : titre, ingrédients, étapes, temps, portions, tags, images, source), **CSV** (`papaparse`, ingrédients/étapes aplatis dans une cellule texte lisible) et **Mealie (JSON)** (approximation du schéma d'export du logiciel [Mealie](https://mealie.io/) : `recipeIngredient`, `recipeInstructions`, durées ISO 8601 `PTnM`). Téléchargement via `file-saver` ; export refusé avec un message si aucune recette n'est cochée.
- **Importer** : sélection d'un fichier `.json` ou `.csv` ; `lib/recipe-io.js` détecte le format, normalise les champs (y compris la reconnaissance du format Mealie) et valide chaque élément avec le même schéma zod que le formulaire de recette (`recipeSchema`) — un élément invalide est ignoré avec un message clair, sans bloquer l'import des autres. **L'utilisateur connecté devient toujours le créateur** des recettes importées, quel que soit le propriétaire indiqué dans le fichier d'origine.

### Messagerie et commentaires

- **Chat de groupe par cookbook** : onglet "Discussion" de `cookbooks/cookbook-detail-page.jsx` (`components/cookbooks/cookbook-chat.jsx`), visible par tous les membres mais l'envoi de message est réservé aux rôles créateur/éditeur/commentateur (`canComment`, voir plus haut) — un lecteur voit l'historique et l'état vide adapté, sans formulaire de saisie, **et le serveur refuse aussi la requête (403)** si le formulaire était contourné. Bulles alignées à droite pour ses propres messages, à gauche pour les autres. Branché sur `GET/POST /cookbooks/:id/messages` (`lib/stores/messages-store.js`) — **pas de Socket.io** : les messages sont bien partagés entre tous les utilisateurs via la base de données, mais il faut recharger la page pour voir un message posté par quelqu'un d'autre entre-temps (pas de temps réel).
- **Commentaires par recette** : section en bas de `recipes/recipe-detail-page.jsx` (`components/recipes/recipe-comments.jsx`), visible par le propriétaire de la recette et par tout membre du cookbook auquel elle est rattachée (contrôle d'accès géré par `GET /recipes/:id`, qui renvoie 404 si non autorisé) ; le formulaire de commentaire suit la même règle `canComment`, également revérifiée côté serveur. Chacun ne peut supprimer que ses propres commentaires (403 sinon). Branché sur `GET/POST /recipes/:id/comments`, `DELETE /comments/:commentId` (`lib/stores/comments-store.js`).

À faire dès qu'un backend Socket.io existe : remplacer le polling manuel (rechargement de page) par de vrais événements `socket.io-client` (déjà en dépendance) pour un vrai temps réel entre navigateurs différents.

### Planning des repas

`pages/planning-page.jsx` affiche une vue semaine (7 jours × 3 créneaux : petit-déjeuner/déjeuner/dîner, icône dédiée par créneau) avec navigation semaine précédente/suivante et retour rapide "Aujourd'hui" (jour courant mis en évidence par un anneau de couleur) ; chaque créneau vide propose un `Select` des recettes de l'utilisateur, chaque créneau rempli affiche un lien vers la recette et un bouton de retrait. Les 7 cartes jour ont une largeur fixe confortable et défilent horizontalement (`overflow-x-auto`) plutôt que de se comprimer dans une grille, pour rester lisibles à toutes les tailles d'écran. Un bouton "Liste de courses" ouvre un `Sheet` qui agrège tous les ingrédients des recettes planifiées sur la semaine affichée (sommées quand les quantités sont numériques ou fractionnaires du type `1/2`, "quantité variable" sinon). Branché sur `PUT /planning` (upsert par date+créneau), `GET /planning?from=&to=` (`lib/stores/planning-store.js`, `hooks/use-my-planning.js` refetch à chaque changement de semaine affichée), `DELETE /planning/:id` ; utilitaires de dates/agrégation dans `lib/planning.js` (le `Date` natif suffit pour une vue semaine simple, pas besoin de librairie de dates dédiée).

### Favoris

`pages/favorites-page.jsx` réutilise `useMyRecipes()` filtré sur `favorite: true` et les mêmes `RecipeCard` que `/recipes` (bascule favori directement possible depuis cette page). Deux états vides distincts : aucune recette créée du tout (bouton "Nouvelle recette" affiché) vs des recettes existent déjà mais aucune n'est encore marquée favorite.

### Recherche et filtrage des recettes

La barre de recherche de la topbar (`components/layout/app-topbar.jsx`) est active : sur `/recipes`, elle lit/écrit le paramètre d'URL `?q=` (via `useSearchParams` de react-router) et filtre en plein texte sur le titre, la source, les tags et les noms d'ingrédients ; depuis n'importe quelle autre page, elle navigue vers `/recipes?q=...` à la soumission. `recipes-page.jsx` ajoute un panneau de filtres (durée totale, favoris uniquement, tags multi-sélection) combinables avec la recherche, avec un bouton de réinitialisation et un état vide dédié ("Aucun résultat") distinct de l'état "Aucune recette".

### Gestion des recettes

`src/lib/stores/recipes-store.js` est branché sur `GET/POST /recipes`, `GET/PATCH/DELETE /recipes/:id`, `PATCH /recipes/:id/favorite` (`fetchAll`, `addRecipe`, `updateRecipe`, `deleteRecipe`, `toggleFavorite`, toutes `async`). `hooks/use-my-recipes.js` déclenche `fetchAll()` une fois par session ; les pages détail/édition (`recipe-detail-page.jsx`, `edit-recipe-page.jsx`) font leur propre fetch unitaire (`GET /recipes/:id`) plutôt que de dériver du store liste — nécessaire pour un rafraîchissement de page fiable (voir plus bas). Chaque recette peut contenir jusqu'à 10 images (converties en data URL côté client, 2 Mo max chacune, stockées telles quelles en base — pas encore d'upload serveur via `multer`), affichées dans un format 4:3 uniforme (`object-cover`) partout dans l'app.

**Filtrage et recherche** : réalisés côté client sur la liste complète déjà chargée (le backend expose aussi `?q=&tags=&time=&favorite=` sur `GET /recipes`, mais ce n'est pas encore utilisé côté frontend — le volume de données d'un projet de ce type ne le justifie pas).

### Cookbooks partagés

`src/lib/stores/cookbooks-store.js` couvre uniquement la liste et le CRUD du cookbook (`GET/POST /cookbooks`, `PATCH/DELETE /cookbooks/:id`) ; l'invitation, le changement de rôle, le retrait de membre et le rattachement/retrait de recette sont gérés directement dans `cookbooks/cookbook-detail-page.jsx` via `src/lib/api.js` (appels ponctuels suivis d'un rafraîchissement du cookbook), puisqu'ils opèrent sur un seul cookbook déjà chargé plutôt que sur la liste.

**Invitation par lien sécurisé** : si l'email invité correspond à un compte existant, le rattachement est immédiat. Sinon, un email contenant un lien d'inscription sécurisé est envoyé par le serveur (voir `backend/README.md`) ; s'inscrire via ce lien (`register-page.jsx` lit `?inviteToken=` dans l'URL et le transmet à `POST /auth/register`) rattache automatiquement le nouveau compte au cookbook avec le rôle prévu — aucune résolution côté client, tout est géré par le serveur.

Quatre rôles : créateur (implicite, propriétaire), éditeur, commentateur, lecteur (`lib/constants/cookbook.js`). Seul le créateur peut modifier/supprimer le cookbook, inviter, changer un rôle ou retirer un membre ; créateur et éditeur peuvent rattacher/retirer des recettes existantes au cookbook ; créateur, éditeur et commentateur peuvent commenter les recettes et discuter (`canComment` dans `lib/cookbook-permissions.js`) — le rôle lecteur est bien en consultation seule, le formulaire de commentaire/message est masqué pour lui **et le serveur refuse la requête si le formulaire est contourné**. `GET /cookbooks/:id` renvoie directement le rôle de l'utilisateur courant (calculé côté serveur) — pas de recalcul client sur cette page.

Une recette n'appartient qu'à un seul cookbook à la fois (`recipe.cookbookId`) ; l'ajout/retrait passe par les endpoints dédiés `POST/DELETE /cookbooks/:id/recipes/:recipeId` (pas par le `PATCH /recipes/:id` générique, qui ignore volontairement ce champ côté serveur). Comme un cookbook peut contenir des recettes possédées par différents membres éditeurs (pas seulement les siennes), la liste des recettes du cookbook vient de `GET /cookbooks/:id/recipes` et non du store recettes local (qui ne contient que "mes" recettes). L'onglet "Recettes" de `cookbook-detail-page.jsx` (organisée en `Tabs` : Recettes / Membres / Discussion) a sa propre barre de recherche, indépendante de celle de la topbar.

### Authentification et session

`src/lib/stores/auth-store.js` est entièrement branché sur l'API réelle : `POST /auth/register` (avec `inviteToken` optionnel), `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PATCH /users/me`, `PATCH /users/me/password`, `PATCH /users/me/preferences`. La session est un cookie httpOnly géré par le navigateur (`lib/api.js`, `withCredentials: true`) — le store ne stocke jamais de token, seulement le profil utilisateur courant.

- **Bootstrap de session** : au montage de `App.jsx`, `bootstrap()` appelle `GET /auth/me` pour savoir si le cookie est valide ; les routes ne sont rendues qu'une fois ce statut connu (`<PageLoader />` sinon), pour éviter un flash de redirection vers `/login`.
- **Inscription sans connexion automatique** : `POST /auth/register` ne pose pas de cookie — `register-page.jsx` affiche un écran "Vérifiez votre boîte mail" après soumission plutôt que de naviguer vers `/recipes`. La connexion est refusée (403, message explicite) tant que l'email n'est pas vérifié.
- **Déconnexion globale sur session expirée** : un 401 sur n'importe quelle route protégée (hors `/auth/*`) déclenche l'event `supmeal:unauthorized` (`lib/api.js`), écouté par `auth-store.js` pour vider `user` — l'utilisateur est alors redirigé vers `/login` par `ProtectedRoute` au prochain rendu.
- **`toggleOAuthConnection`** reste une bascule locale en mémoire (pas de flux OAuth2 réel côté serveur, cf. `connections-tab.jsx`) — ne survit pas à un rechargement, contrairement au reste qui vient désormais du serveur.
- Les pages `/verify-email` et `/reset-password` (`src/pages/auth/verify-email-page.jsx`, `reset-password-page.jsx`) appellent directement `src/lib/api.js` plutôt que de passer par le store, car ce sont des flux ponctuels sans état de session associé. `login-page.jsx` a un lien "Mot de passe oublié ?" vers `/reset-password`.

Voir [`../SUIVI_PROJET.md`](../SUIVI_PROJET.md) à la racine du dépôt pour le suivi détaillé du projet dans son ensemble.
