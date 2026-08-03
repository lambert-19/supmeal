import { create } from "zustand"
import { persist } from "zustand/middleware"

function createId() {
  return `comment-${Math.random().toString(36).slice(2, 10)}`
}

export const useCommentsStore = create(
  persist(
    (set) => ({
      comments: [],

      addComment(recipeId, { authorId, authorName, text }) {
        const comment = {
          id: createId(),
          recipeId,
          authorId,
          authorName,
          text,
          createdAt: Date.now(),
        }
        set((state) => ({ comments: [...state.comments, comment] }))
        return comment
      },

      deleteComment(id) {
        set((state) => ({ comments: state.comments.filter((comment) => comment.id !== id) }))
      },
    }),
    { name: "supmeal-comments" }
  )
)
