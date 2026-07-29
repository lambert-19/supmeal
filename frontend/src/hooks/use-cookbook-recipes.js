import { useMemo } from "react"

import { useRecipesStore } from "@/lib/stores/recipes-store"

export function useCookbookRecipes(cookbookId) {
  const recipes = useRecipesStore((s) => s.recipes)
  return useMemo(() => recipes.filter((recipe) => recipe.cookbookId === cookbookId), [recipes, cookbookId])
}
