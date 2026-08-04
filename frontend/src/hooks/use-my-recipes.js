import { useEffect } from "react"

import { useRecipesStore } from "@/lib/stores/recipes-store"

export function useMyRecipes() {
  const recipes = useRecipesStore((s) => s.recipes)
  const status = useRecipesStore((s) => s.status)
  const fetchAll = useRecipesStore((s) => s.fetchAll)

  useEffect(() => {
    if (status === "idle") fetchAll()
  }, [status, fetchAll])

  return recipes
}
