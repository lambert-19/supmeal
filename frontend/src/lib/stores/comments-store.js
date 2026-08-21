import { create } from "zustand"

import { api } from "@/lib/api"
import { fetchWithStatus } from "@/lib/stores/store-helpers"

// Un seul jeu de commentaires en mémoire à la fois (ceux de la recette
// actuellement affichée) — remplacé intégralement à chaque fetch, pas de cache
// multi-recettes à gérer.
export const useCommentsStore = create((set) => ({
  comments: [],
  recipeId: null,
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchByRecipe(recipeId) {
    await fetchWithStatus(
      set,
      "comments",
      () => api.get(`/recipes/${recipeId}/comments`).then((r) => r.data),
      "Impossible de charger les commentaires.",
      { recipeId }
    )
  },

  async addComment(recipeId, text) {
    const { data } = await api.post(`/recipes/${recipeId}/comments`, { text })
    // Dédoublonné par id : le serveur rediffuse aussi ce commentaire via
    // Socket.io à tous les clients de la room, y compris son propre auteur.
    set((state) => (state.comments.some((c) => c.id === data.id) ? state : { comments: [...state.comments, data] }))
    return data
  },

  async deleteComment(id) {
    await api.delete(`/comments/${id}`)
    set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }))
  },

  // Commentaire reçu en temps réel via Socket.io (voir hooks/use-recipe-comments.js).
  receiveComment(recipeId, comment) {
    set((state) => {
      if (state.recipeId !== recipeId || state.comments.some((c) => c.id === comment.id)) return state
      return { comments: [...state.comments, comment] }
    })
  },

  removeCommentRealtime(recipeId, commentId) {
    set((state) => {
      if (state.recipeId !== recipeId) return state
      return { comments: state.comments.filter((c) => c.id !== commentId) }
    })
  },
}))
