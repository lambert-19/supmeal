import { useMemo } from "react"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useRecipesStore } from "@/lib/stores/recipes-store"

export function useMyRecipes() {
  const userId = useAuthStore((s) => s.user?.id)
  const recipes = useRecipesStore((s) => s.recipes)
  return useMemo(() => recipes.filter((recipe) => recipe.ownerId === userId), [recipes, userId])
}
