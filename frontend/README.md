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
- **axios**, **socket.io-client**, **papaparse**, **file-saver** : prévus pour les appels API, la messagerie temps réel et l'import/export, au fur et à mesure de l'avancement du backend

## Lancer le projet

```bash
npm install
npm run dev
```

L'app est servie sur http://localhost:5173.

Autres scripts : `npm run build` (build de production), `npm run preview` (prévisualiser le build), `npm run lint` (ESLint).

## Structure

```
src/
  components/
    ui/          composants shadcn/ui générés (button, input, sheet, dropdown-menu, carousel, alert-dialog, ...)
    layout/       sidebar, topbar, menu utilisateur, liens de navigation
    recipes/      carte recette, formulaire recette, upload d'images en galerie
    cookbooks/    carte cookbook, formulaire cookbook
    *.jsx          composants partagés (page-header, empty-state, form-field, theme-toggle, tag-input)
  layouts/         layout d'authentification (écran scindé) et layout applicatif (sidebar + topbar)
  routes/          garde-fous de routage (route protégée / route publique uniquement)
  hooks/           hooks partagés (use-my-recipes : aussi réutilisé par la page Favoris, use-my-cookbooks, use-cookbook-recipes, use-my-planning)
  pages/
    auth/          connexion, inscription
    settings/       les 4 onglets de la page Paramètres (profil, sécurité, connexions, préférences)
    recipes/        création, édition, détail d'une recette
    cookbooks/      création, édition, détail d'un cookbook (membres, rôles, recettes)
    *.jsx          pages applicatives (liste des recettes, cookbooks, planning, favoris, paramètres)
  lib/
    stores/        state global zustand (auth-store.js, recipes-store.js, cookbooks-store.js, planning-store.js)
    schemas/        schémas de validation zod (auth.js, settings.js, recipe.js, cookbook.js)
    constants/      listes de référence (régimes, cuisines, allergènes, fournisseurs OAuth2, unités, tags, rôles de cookbook, taille max image)
    cookbook-permissions.js  calcul du rôle d'un utilisateur sur un cookbook + garde-fous de permission
    planning.js    utilitaires de dates (semaine, jours) et d'agrégation de quantités pour la liste de courses
    nav-items.js   liste des liens de navigation de la sidebar
    utils.js        helper `cn` (clsx + tailwind-merge)
```

## État d'avancement

Le routing, le layout applicatif (sidebar/topbar, thème clair/sombre), les pages de connexion/inscription, la page Paramètres (profil, sécurité, connexions OAuth2, préférences culinaires), la gestion des recettes (liste, création, édition, détail, favoris, jusqu'à 10 images en carrousel), la recherche/filtrage des recettes, les cookbooks partagés (création, invitation, rôles, rattachement de recettes), la page Favoris et le Planning des repas sont en place. Restent en attente : la messagerie/les commentaires, et l'import/export.

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

Quatre rôles : créateur (implicite, propriétaire), éditeur, commentateur, lecteur (`lib/constants/cookbook.js`). Seul le créateur peut modifier/supprimer le cookbook, inviter, changer un rôle ou retirer un membre ; créateur et éditeur peuvent rattacher/retirer des recettes existantes au cookbook. Le rôle "commentateur" est réservé pour la fonctionnalité de commentaires à venir (pas encore de différence de comportement avec "lecteur").

Une recette n'appartient qu'à un seul cookbook à la fois (`recipe.cookbookId`, nullable, ajouté à `recipes-store.js`) ; l'ajout/retrait se fait depuis la page détail du cookbook (`cookbooks/cookbook-detail-page.jsx`), qui a aussi sa propre barre de recherche (indépendante de celle de la topbar, qui ne cible que `/recipes`).

À faire dès que l'API cookbooks existe : remplacer `cookbooks-store.js` par de vrais appels API et une vraie notification d'invitation (email) plutôt qu'une résolution silencieuse par email.

### Authentification actuellement mockée

Le backend n'expose pas encore de routes d'authentification. En attendant, `src/lib/stores/auth-store.js` simule un backend d'auth directement dans le navigateur :

- les comptes créés via `/register` sont stockés dans `localStorage` (mot de passe en clair — **acceptable uniquement parce que c'est un mock de développement local**, à ne jamais faire côté serveur) ;
- un compte de démonstration est préchargé : `demo@supmeal.fr` / `supmeal123` ;
- `login`, `register` et `logout` sont les seules méthodes exposées par le store, pour pouvoir les rebrancher sur de vrais appels API (JWT, OAuth2) sans changer les pages qui les consomment.

À faire dès que l'API d'authentification existe : remplacer le contenu de `auth-store.js` par des appels `axios` vers le backend et supprimer la persistance `localStorage` des mots de passe.

Voir [`../SUIVI_PROJET.md`](../SUIVI_PROJET.md) à la racine du dépôt pour le suivi détaillé du projet dans son ensemble.
