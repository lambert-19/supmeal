export function getCookbookRole(cookbook, user) {
  if (!cookbook || !user) return null
  if (cookbook.ownerId === user.id) return "creator"
  const member = cookbook.members.find(
    (m) => (m.userId && m.userId === user.id) || m.email.toLowerCase() === user.email.toLowerCase()
  )
  return member?.role ?? null
}

export function canManageCookbook(role) {
  return role === "creator"
}

export function canEditRecipes(role) {
  return role === "creator" || role === "editor"
}
