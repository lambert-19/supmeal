import { useEffect } from "react"

import { useCommentsStore } from "@/lib/stores/comments-store"
import { getSocket } from "@/lib/socket"

export function useRecipeComments(recipeId) {
  const comments = useCommentsStore((s) => s.comments)
  const fetchByRecipe = useCommentsStore((s) => s.fetchByRecipe)
  const receiveComment = useCommentsStore((s) => s.receiveComment)
  const removeCommentRealtime = useCommentsStore((s) => s.removeCommentRealtime)

  useEffect(() => {
    fetchByRecipe(recipeId)

    const socket = getSocket()
    socket.emit("recipe:join", recipeId)

    function handleNewComment(comment) {
      receiveComment(recipeId, comment)
    }
    socket.on("comment:new", handleNewComment)

    function handleCommentDeleted({ id }) {
      removeCommentRealtime(recipeId, id)
    }
    socket.on("comment:deleted", handleCommentDeleted)

    return () => {
      socket.emit("recipe:leave", recipeId)
      socket.off("comment:new", handleNewComment)
      socket.off("comment:deleted", handleCommentDeleted)
    }
  }, [recipeId, fetchByRecipe, receiveComment, removeCommentRealtime])

  return comments
}
