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
    ui/          composants shadcn/ui générés (button, input, sheet, dropdown-menu, ...)
    layout/       sidebar, topbar, menu utilisateur, liens de navigation
    *.jsx          composants partagés (page-header, empty-state, form-field, theme-toggle)
  layouts/         layout d'authentification (écran scindé) et layout applicatif (sidebar + topbar)
  routes/          garde-fous de routage (route protégée / route publique uniquement)
  pages/
    auth/          connexion, inscription
    *.jsx          pages applicatives (recettes, cookbooks, planning, favoris, paramètres)
  lib/
    stores/        state global zustand (auth-store.js)
    schemas/        schémas de validation zod
    nav-items.js   liste des liens de navigation de la sidebar
    utils.js        helper `cn` (clsx + tailwind-merge)
```

## État d'avancement

Le routing, le layout applicatif (sidebar/topbar, thème clair/sombre) et les pages de connexion/inscription sont en place. Les pages Recettes, Cookbooks, Planning, Favoris et Paramètres sont pour l'instant des **placeholders** (état vide) en attendant que les fonctionnalités correspondantes soient développées.

### Authentification actuellement mockée

Le backend n'expose pas encore de routes d'authentification. En attendant, `src/lib/stores/auth-store.js` simule un backend d'auth directement dans le navigateur :

- les comptes créés via `/register` sont stockés dans `localStorage` (mot de passe en clair — **acceptable uniquement parce que c'est un mock de développement local**, à ne jamais faire côté serveur) ;
- un compte de démonstration est préchargé : `demo@supmeal.fr` / `supmeal123` ;
- `login`, `register` et `logout` sont les seules méthodes exposées par le store, pour pouvoir les rebrancher sur de vrais appels API (JWT, OAuth2) sans changer les pages qui les consomment.

À faire dès que l'API d'authentification existe : remplacer le contenu de `auth-store.js` par des appels `axios` vers le backend et supprimer la persistance `localStorage` des mots de passe.

Voir [`../SUIVI_PROJET.md`](../SUIVI_PROJET.md) à la racine du dépôt pour le suivi détaillé du projet dans son ensemble.
