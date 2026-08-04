function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferences: {
      dietaryRegime: user.dietaryRegime,
      allergies: user.allergies,
      favoriteCuisine: user.favoriteCuisine,
      defaultServings: user.defaultServings,
    },
    connections: {
      google: user.connectedGoogle,
      github: user.connectedGithub,
    },
  };
}

function toRecipeDTO(recipe) {
  return {
    id: recipe.id,
    ownerId: recipe.ownerId,
    title: recipe.title,
    ingredients: recipe.ingredients
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    steps: recipe.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ text: s.text })),
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    tags: recipe.tags,
    images: recipe.images,
    source: recipe.source,
    favorite: recipe.favorite,
    cookbookId: recipe.cookbookId,
    cookbook: recipe.cookbook ? { id: recipe.cookbook.id, name: recipe.cookbook.name } : null,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

function toCookbookMemberDTO(member) {
  return {
    id: member.id,
    cookbookId: member.cookbookId,
    userId: member.userId,
    email: member.email,
    name: member.name,
    role: member.role,
    pending: !member.userId,
  };
}

function toCookbookDTO(cookbook) {
  const { _count, ...rest } = cookbook;
  return {
    ...rest,
    members: cookbook.members.map(toCookbookMemberDTO),
    owner: cookbook.owner ? { id: cookbook.owner.id, name: cookbook.owner.name, email: cookbook.owner.email } : undefined,
    recipesCount: _count?.recipes ?? 0,
  };
}

function toCommentDTO(comment) {
  return {
    id: comment.id,
    recipeId: comment.recipeId,
    authorId: comment.authorId,
    authorName: comment.author.name,
    text: comment.text,
    createdAt: comment.createdAt,
  };
}

function toMessageDTO(message) {
  return {
    id: message.id,
    cookbookId: message.cookbookId,
    authorId: message.authorId,
    authorName: message.author.name,
    text: message.text,
    createdAt: message.createdAt,
  };
}

module.exports = { toSafeUser, toRecipeDTO, toCookbookMemberDTO, toCookbookDTO, toCommentDTO, toMessageDTO };
