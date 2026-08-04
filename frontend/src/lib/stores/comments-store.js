import { create } from "zustand"

import { api, apiErrorMessage } from "@/lib/api"

// Un seul jeu de commentaires en mémoire à la fois (ceux de la recette
// actuellement affichée) — remplacé intégralement à chaque fetch, pas de cache
// multi-recettes à gérer.
export const useCommentsStore = create((set) => ({
  comments: [],
  recipeId: null,
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchByRecipe(recipeId) {
    set({ status: "loading", error: null, recipeId })
    try {
      const { data } = await api.get(`/recipes/${recipeId}/comments`)
      set({ comments: data, status: "loaded" })
    } catch (error) {
      set({ status: "error", error: apiErrorMessage(error, "Impossible de charger les commentaires.") })
    }
  },

  async addComment(recipeId, text) {
    const { data } = await api.post(`/recipes/${recipeId}/comments`, { text })
    set((state) => ({ comments: [...state.comments, data] }))
    return data
  },

  async deleteComment(id) {
    await api.delete(`/comments/${id}`)
    set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }))
  },
}))
