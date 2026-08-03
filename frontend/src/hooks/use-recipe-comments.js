import { useMemo } from "react"

import { useCommentsStore } from "@/lib/stores/comments-store"

export function useRecipeComments(recipeId) {
  const comments = useCommentsStore((s) => s.comments)
  return useMemo(
    () =>
      comments
        .filter((comment) => comment.recipeId === recipeId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [comments, recipeId]
  )
}
