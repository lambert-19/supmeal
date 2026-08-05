// Reflète la politique de mot de passe du serveur (backend/utils/passwordPolicy.js) :
// 8 caractères minimum, au moins une minuscule, une majuscule, un chiffre et un
// caractère spécial.
export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "8 caractères minimum", test: (value) => value.length >= 8 },
  { id: "lowercase", label: "Une lettre minuscule", test: (value) => /[a-z]/.test(value) },
  { id: "uppercase", label: "Une lettre majuscule", test: (value) => /[A-Z]/.test(value) },
  { id: "number", label: "Un chiffre", test: (value) => /[0-9]/.test(value) },
  { id: "symbol", label: "Un caractère spécial (ex. ! ? # @ -)", test: (value) => /[^a-zA-Z0-9]/.test(value) },
]

export const PASSWORD_MESSAGE =
  "8 caractères minimum, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial."

export function meetsPasswordRequirements(value) {
  return PASSWORD_REQUIREMENTS.every((rule) => rule.test(value ?? ""))
}

// "weak" tant que les exigences minimales ne sont pas toutes remplies, puis
// "medium"/"strong" selon la longueur et la présence d'un symbole, pour
// encourager (sans l'exiger) un mot de passe plus robuste que le minimum.
export function getPasswordStrength(value) {
  const safeValue = value ?? ""
  const metCount = PASSWORD_REQUIREMENTS.filter((rule) => rule.test(safeValue)).length
  const meetsAllRequirements = metCount === PASSWORD_REQUIREMENTS.length

  if (!safeValue) return { level: "empty", label: "", meetsAllRequirements: false, metCount }
  if (!meetsAllRequirements) return { level: "weak", label: "Faible", meetsAllRequirements, metCount }

  const isLong = safeValue.length >= 15
  if (isLong) return { level: "strong", label: "Fort", meetsAllRequirements, metCount }
  return { level: "medium", label: "Moyen", meetsAllRequirements, metCount }
}
