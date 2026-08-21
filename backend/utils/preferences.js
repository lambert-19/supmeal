// Miroir de frontend/src/lib/constants/preferences.js (mêmes valeurs/libellés) — les
// suggestions de recettes comparent ces libellés français aux tags/titres libres saisis
// par l'utilisateur, faute de vocabulaire de tags contrôlé côté recette.
const DIETARY_REGIMES = {
  none: "Aucun régime particulier",
  vegetarian: "Végétarien",
  vegan: "Végan",
  gluten_free: "Sans gluten",
  lactose_free: "Sans lactose",
  halal: "Halal",
  kosher: "Casher",
};

const CUISINES = {
  none: "Pas de préférence",
  french: "Française",
  italian: "Italienne",
  asian: "Asiatique",
  mexican: "Mexicaine",
  mediterranean: "Méditerranéenne",
  indian: "Indienne",
  american: "Américaine",
};

const ALLERGENS = {
  gluten: "Gluten",
  lactose: "Lactose",
  arachides: "Arachides",
  fruits_a_coque: "Fruits à coque",
  oeufs: "Œufs",
  poisson: "Poisson",
  crustaces: "Crustacés",
  soja: "Soja",
};

module.exports = { DIETARY_REGIMES, CUISINES, ALLERGENS };
