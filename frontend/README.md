# SUPMEAL — Frontend

Client web de SUPMEAL (gestion de recettes et planification de repas). Ce client n'interroge que l'API du dossier `backend/` — aucune logique métier ne doit vivre ici.

## Stack

- **React 19** + **Vite** (build/dev server)
- **React Router DOM** pour le routing et la protection des routes
- **Tailwind CSS v4** + **shadcn/ui** (style `base-nova`, primitives [`@base-ui/react`](https://base-ui.com)) pour l'UI
- **react-hook-form** + **zod** pour la validation des formulaires
- **zustand** (avec persistance `localStorage`) pour l'état global (auth, etc.)
- **next-themes** pour le thème clair/sombre
- **sonner** pour les notifications toast
- **react-dropzone** pour l'upload d'images par glisser-déposer (recettes)
- **embla-carousel-react** (via le composant `carousel` de shadcn) pour le carrousel d'images d'une recette
- **socket.io-client** : prévu pour un vrai temps réel de la messagerie, au fur et à mesure de l'avancement du backend (chat actuellement mocké en `localStorage`)
- **papaparse** pour l'export/import CSV des recettes, **file-saver** pour déclencher le téléchargement des fichiers exportés
- **axios** : prévu pour les appels API, au fur et à mesure de l'avancement du backend
- **framer-motion** pour les animations (effet 3D au survol des cartes recettes, transitions de page, apparition échelonnée des grilles, micro-interactions) — toujours conditionnées par `useReducedMotion()`
- **vitest** installé pour les tests unitaires (`npm run test`), configuré dans `vite.config.js` — aucun fichier de test présent actuellement

## Lancer le projet

```bash
npm install
npm run dev
```

L'app est servie sur http://localhost:5173.

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
  hooks/           hooks partagés (use-my-recipes : aussi réutilisé par la page Favoris, use-my-cookbooks, use-cookbook-recipes, use-my-planning, use-recipe-comments, use-cookbook-messages)
  pages/
    auth/          connexion, inscription
    settings/       les 4 onglets de la page Paramètres (profil, sécurité, connexions, préférences)
    recipes/        création, édition, détail d'une recette (avec ses commentaires)
    cookbooks/      création, édition, détail d'un cookbook (onglets Recettes/Membres/Discussion)
    *.jsx          pages applicatives (liste des recettes, cookbooks, planning, favoris, paramètres) — routées via `React.lazy()` dans `App.jsx`
  lib/
    stores/        state global zustand (auth-store.js, recipes-store.js, cookbooks-store.js, planning-store.js, comments-store.js, messages-store.js, store-utils.js pour `createId` partagé)
    schemas/        schémas de validation zod (auth.js, settings.js, recipe.js, cookbook.js)
    constants/      listes de référence (régimes, cuisines, allergènes, fournisseurs OAuth2, unités, tags, rôles de cookbook, taille max image)
    cookbook-permissions.js  calcul du rôle d'un utilisateur sur un cookbook + garde-fous de permission
    planning.js    utilitaires de dates (semaine, jours) et d'agrégation de quantités pour la liste de courses
    recipe-io.js   export JSON/CSV/Mealie et import (détection de format, normalisation, validation zod)
    motion-variants.js  variantes framer-motion partagées (apparition échelonnée des grilles)
    nav-items.js   liste des liens de navigation de la sidebar
    utils.js        helper `cn` (clsx + tailwind-merge)
```

## État d'avancement

Le routing, le layout applicatif (sidebar/topbar, thème clair/sombre), les pages de connexion/inscription, la page Paramètres (profil, sécurité, connexions OAuth2, préférences culinaires), la gestion des recettes (liste, création, édition, détail, favoris, jusqu'à 10 images en carrousel), la recherche/filtrage des recettes, les cookbooks partagés (création, invitation, rôles, rattachement de recettes), la page Favoris, le Planning des repas, la Messagerie/Commentaires et l'Import/Export des recettes sont en place. **Toutes les fonctionnalités frontend prévues sont couvertes en mock** ; la suite est côté backend/infra (voir `SUIVI_PROJET.md`).

Une première passe "niveau professionnel" (critère bonus) a aussi été faite : gestion d'erreurs, tests unitaires, découpage du bundle par route, cohérence des permissions, et polish visuel 2D/3D — voir la section dédiée ci-dessous.

### Niveau professionnel (bonus) : robustesse et polish visuel

**Robustesse / architecture / performance :**
- `components/error-boundary.jsx` (composant classe) enveloppe l'app dans `main.jsx` — écran de secours au lieu d'un écran blanc en cas d'erreur de rendu.
- `App.jsx` charge les 14 pages via `React.lazy()` + `Suspense` (`components/page-loader.jsx`) au lieu d'imports statiques : le chunk principal est passé de 797 Ko à ~320 Ko (hors framer-motion), chaque page ne chargeant que son propre code à la navigation.
- `lib/stores/store-utils.js` centralise `createId(prefix)`, jusque-là dupliqué à l'identique dans les 6 stores.
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

- **Chat de groupe par cookbook** : onglet "Discussion" de `cookbooks/cookbook-detail-page.jsx` (`components/cookbooks/cookbook-chat.jsx`), visible par tous les membres mais l'envoi de message est réservé aux rôles créateur/éditeur/commentateur (`canComment`, voir plus haut) — un lecteur voit l'historique et l'état vide adapté, sans formulaire de saisie. Bulles alignées à droite pour ses propres messages, à gauche pour les autres. Mock dans `lib/stores/messages-store.js` — **pas de Socket.io réel** (aucun backend à connecter pour l'instant) : les messages sont juste partagés via `localStorage`, donc visibles entre comptes du même navigateur mais pas en temps réel entre deux navigateurs différents.
- **Commentaires par recette** : section en bas de `recipes/recipe-detail-page.jsx` (`components/recipes/recipe-comments.jsx`), visible par le propriétaire de la recette et par tout membre du cookbook auquel elle est rattachée ; le formulaire de commentaire suit la même règle `canComment` (masqué pour les lecteurs). Chacun ne peut supprimer que ses propres commentaires. Mock dans `lib/stores/comments-store.js`.
- **Bug corrigé au passage** : `recipe-detail-page.jsx` ne lisait que `useMyRecipes()` (recettes du seul propriétaire connecté), donc un membre de cookbook cliquant sur une recette partagée par quelqu'un d'autre se faisait rediriger vers `/recipes` sans explication. Corrigé en lisant le store recettes directement et en autorisant l'accès si l'utilisateur est propriétaire **ou** a un rôle sur le cookbook de la recette (`getCookbookRole`) ; le bouton favori et les actions modifier/supprimer restent réservés au propriétaire.

À faire dès qu'un backend Socket.io existe : remplacer `messages-store.js` par de vrais événements `socket.io-client` (déjà en dépendance) pour un vrai temps réel entre navigateurs différents.

### Planning des repas

`pages/planning-page.jsx` affiche une vue semaine (7 jours × 3 créneaux : petit-déjeuner/déjeuner/dîner, icône dédiée par créneau) avec navigation semaine précédente/suivante et retour rapide "Aujourd'hui" (jour courant mis en évidence par un anneau de couleur) ; chaque créneau vide propose un `Select` des recettes de l'utilisateur, chaque créneau rempli affiche un lien vers la recette et un bouton de retrait. Les 7 cartes jour ont une largeur fixe confortable et défilent horizontalement (`overflow-x-auto`) plutôt que de se comprimer dans une grille, pour rester lisibles à toutes les tailles d'écran. Un bouton "Liste de courses" ouvre un `Sheet` qui agrège tous les ingrédients des recettes planifiées sur la semaine affichée (sommées quand les quantités sont numériques ou fractionnaires du type `1/2`, "quantité variable" sinon). Stockage mock dans `lib/stores/planning-store.js` (une entrée par date + créneau), utilitaires de dates/agrégation dans `lib/planning.js` (le `Date` natif suffit pour une vue semaine simple, pas besoin de librairie de dates dédiée).

### Favoris

`pages/favorites-page.jsx` réutilise `useMyRecipes()` filtré sur `favorite: true` et les mêmes `RecipeCard` que `/recipes` (bascule favori directement possible depuis cette page). Deux états vides distincts : aucune recette créée du tout (bouton "Nouvelle recette" affiché) vs des recettes existent déjà mais aucune n'est encore marquée favorite.

### Recherche et filtrage des recettes

La barre de recherche de la topbar (`components/layout/app-topbar.jsx`) est active : sur `/recipes`, elle lit/écrit le paramètre d'URL `?q=` (via `useSearchParams` de react-router) et filtre en plein texte sur le titre, la source, les tags et les noms d'ingrédients ; depuis n'importe quelle autre page, elle navigue vers `/recipes?q=...` à la soumission. `recipes-page.jsx` ajoute un panneau de filtres (durée totale, favoris uniquement, tags multi-sélection) combinables avec la recherche, avec un bouton de réinitialisation et un état vide dédié ("Aucun résultat") distinct de l'état "Aucune recette".

### Gestion des recettes (mock)

Comme pour l'auth, `src/lib/stores/recipes-store.js` simule un backend directement dans le navigateur (zustand + `persist`) : `addRecipe`, `updateRecipe`, `deleteRecipe`, `toggleFavorite`, avec deux recettes de démonstration préchargées une seule fois (elles ne réapparaissent pas si supprimées). Chaque recette peut contenir jusqu'à 10 images (converties en data URL côté client, 2 Mo max chacune), affichées dans un format 4:3 uniforme (`object-cover`) partout dans l'app pour éviter tout étirement ou recadrage incohérent selon l'orientation de la photo d'origine.

À faire dès que l'API recettes existe : remplacer `recipes-store.js` par de vrais appels API (même logique que pour `auth-store.js` ci-dessous) et déplacer l'upload d'images vers un vrai stockage serveur (`multer` est déjà en dépendance backend).

### Cookbooks partagés (mock)

`src/lib/stores/cookbooks-store.js` simule un backend de cookbooks partagés : `addCookbook`, `updateCookbook`, `deleteCookbook`, `inviteMember`, `updateMemberRole`, `removeMember`. Chaque cookbook a un créateur (`ownerId`) et une liste de membres identifiés par email (pas seulement par `userId`), ce qui permet d'inviter quelqu'un qui n'a pas encore de compte : l'invitation reste "en attente" jusqu'à ce que cet email corresponde à un compte mock existant (`findMockUserByEmail` dans `auth-store.js`), moment où elle est automatiquement reconnue comme active (voir `getCookbookRole` dans `lib/cookbook-permissions.js`, qui recherche par `userId` **ou** par email).

Quatre rôles : créateur (implicite, propriétaire), éditeur, commentateur, lecteur (`lib/constants/cookbook.js`). Seul le créateur peut modifier/supprimer le cookbook, inviter, changer un rôle ou retirer un membre ; créateur et éditeur peuvent rattacher/retirer des recettes existantes au cookbook ; créateur, éditeur et commentateur peuvent commenter les recettes et discuter (`canComment` dans `lib/cookbook-permissions.js`) — le rôle lecteur est bien en consultation seule, le formulaire de commentaire/message est masqué pour lui.

Une recette n'appartient qu'à un seul cookbook à la fois (`recipe.cookbookId`, nullable, ajouté à `recipes-store.js`) ; l'ajout/retrait se fait depuis l'onglet "Recettes" de la page détail du cookbook (`cookbooks/cookbook-detail-page.jsx`, organisée en `Tabs` : Recettes / Membres / Discussion), qui a aussi sa propre barre de recherche (indépendante de celle de la topbar, qui ne cible que `/recipes`).

À faire dès que l'API cookbooks existe : remplacer `cookbooks-store.js` par de vrais appels API et une vraie notification d'invitation (email) plutôt qu'une résolution silencieuse par email.

### Authentification actuellement mockée

Le backend n'expose pas encore de routes d'authentification. En attendant, `src/lib/stores/auth-store.js` simule un backend d'auth directement dans le navigateur :

- les comptes créés via `/register` sont stockés dans `localStorage` (mot de passe en clair — **acceptable uniquement parce que c'est un mock de développement local**, à ne jamais faire côté serveur) ;
- un compte de démonstration est préchargé : `demo@supmeal.fr` / `supmeal123` ;
- `login`, `register` et `logout` sont les seules méthodes exposées par le store, pour pouvoir les rebrancher sur de vrais appels API (JWT, OAuth2) sans changer les pages qui les consomment.

À faire dès que l'API d'authentification existe : remplacer le contenu de `auth-store.js` par des appels `axios` vers le backend et supprimer la persistance `localStorage` des mots de passe.

Voir [`../SUIVI_PROJET.md`](../SUIVI_PROJET.md) à la racine du dépôt pour le suivi détaillé du projet dans son ensemble.
