// Normalise une chaine pour une comparaison insensible a la casse et aux accents
// (ex. "Vegetarien" et "vegetarien" doivent matcher) - utilise par les suggestions
// de recettes pour comparer les tags/titres/ingredients libres saisis par l'utilisateur
// aux libelles fixes des preferences (regime, cuisine, allergies).
function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim();
}

module.exports = { normalizeText };
