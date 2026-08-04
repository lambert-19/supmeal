function getCookbookRole(cookbook, user) {
  if (!cookbook || !user) return null;
  if (cookbook.ownerId === user.id) return "creator";
  const member = cookbook.members.find(
    (m) => (m.userId && m.userId === user.id) || (m.email && m.email.toLowerCase() === user.email.toLowerCase())
  );
  return member?.role ?? null;
}

function canManageCookbook(role) {
  return role === "creator";
}

function canEditRecipes(role) {
  return role === "creator" || role === "editor";
}

function canComment(role) {
  return role === "creator" || role === "editor" || role === "commentator";
}

module.exports = { getCookbookRole, canManageCookbook, canEditRecipes, canComment };
