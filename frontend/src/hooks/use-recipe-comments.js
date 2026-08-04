import { useEffect } from "react"

import { useCommentsStore } from "@/lib/stores/comments-store"

export function useRecipeComments(recipeId) {
  const comments = useCommentsStore((s) => s.comments)
  const fetchByRecipe = useCommentsStore((s) => s.fetchByRecipe)

  useEffect(() => {
    fetchByRecipe(recipeId)
  }, [recipeId, fetchByRecipe])

  return comments
}
