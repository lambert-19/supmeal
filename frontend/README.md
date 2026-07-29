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
    *.jsx          composants partagés (page-header, empty-state, form-field, theme-toggle, tag-input)
  layouts/         layout d'authentification (écran scindé) et layout applicatif (sidebar + topbar)
  routes/          garde-fous de routage (route protégée / route publique uniquement)
  hooks/           hooks partagés (use-my-recipes : recettes de l'utilisateur connecté)
  pages/
    auth/          connexion, inscription
    settings/       les 4 onglets de la page Paramètres (profil, sécurité, connexions, préférences)
    recipes/        création, édition, détail d'une recette
    *.jsx          pages applicatives (liste des recettes, cookbooks, planning, favoris, paramètres)
  lib/
    stores/        state global zustand (auth-store.js, recipes-store.js)
    schemas/        schémas de validation zod (auth.js, settings.js, recipe.js)
    constants/      listes de référence (régimes, cuisines, allergènes, fournisseurs OAuth2, unités, tags, taille max image)
    nav-items.js   liste des liens de navigation de la sidebar
    utils.js        helper `cn` (clsx + tailwind-merge)
```

## État d'avancement

Le routing, le layout applicatif (sidebar/topbar, thème clair/sombre), les pages de connexion/inscription, la page Paramètres (profil, sécurité, connexions OAuth2, préférences culinaires), la gestion des recettes (liste, création, édition, détail, favoris, jusqu'à 10 images en carrousel) et la recherche/filtrage des recettes sont en place. Les pages Cookbooks, Planning et Favoris sont pour l'instant des **placeholders** (état vide) en attendant que les fonctionnalités correspondantes soient développées — la page Favoris devra filtrer `useMyRecipes()` sur `favorite: true`.

### Recherche et filtrage des recettes

La barre de recherche de la topbar (`components/layout/app-topbar.jsx`) est active : sur `/recipes`, elle lit/écrit le paramètre d'URL `?q=` (via `useSearchParams` de react-router) et filtre en plein texte sur le titre, la source, les tags et les noms d'ingrédients ; depuis n'importe quelle autre page, elle navigue vers `/recipes?q=...` à la soumission. `recipes-page.jsx` ajoute un panneau de filtres (durée totale, favoris uniquement, tags multi-sélection) combinables avec la recherche, avec un bouton de réinitialisation et un état vide dédié ("Aucun résultat") distinct de l'état "Aucune recette".

### Gestion des recettes (mock)

Comme pour l'auth, `src/lib/stores/recipes-store.js` simule un backend directement dans le navigateur (zustand + `persist`) : `addRecipe`, `updateRecipe`, `deleteRecipe`, `toggleFavorite`, avec deux recettes de démonstration préchargées une seule fois (elles ne réapparaissent pas si supprimées). Chaque recette peut contenir jusqu'à 10 images (converties en data URL côté client, 2 Mo max chacune), affichées dans un format 4:3 uniforme (`object-cover`) partout dans l'app pour éviter tout étirement ou recadrage incohérent selon l'orientation de la photo d'origine.

À faire dès que l'API recettes existe : remplacer `recipes-store.js` par de vrais appels API (même logique que pour `auth-store.js` ci-dessous) et déplacer l'upload d'images vers un vrai stockage serveur (`multer` est déjà en dépendance backend).

### Authentification actuellement mockée

Le backend n'expose pas encore de routes d'authentification. En attendant, `src/lib/stores/auth-store.js` simule un backend d'auth directement dans le navigateur :

- les comptes créés via `/register` sont stockés dans `localStorage` (mot de passe en clair — **acceptable uniquement parce que c'est un mock de développement local**, à ne jamais faire côté serveur) ;
- un compte de démonstration est préchargé : `demo@supmeal.fr` / `supmeal123` ;
- `login`, `register` et `logout` sont les seules méthodes exposées par le store, pour pouvoir les rebrancher sur de vrais appels API (JWT, OAuth2) sans changer les pages qui les consomment.

À faire dès que l'API d'authentification existe : remplacer le contenu de `auth-store.js` par des appels `axios` vers le backend et supprimer la persistance `localStorage` des mots de passe.

Voir [`../SUIVI_PROJET.md`](../SUIVI_PROJET.md) à la racine du dépôt pour le suivi détaillé du projet dans son ensemble.
