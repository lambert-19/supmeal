import { create } from "zustand"

import { api, apiErrorMessage } from "@/lib/api"

export const useRecipesStore = create((set) => ({
  recipes: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchAll() {
    set({ status: "loading", error: null })
    try {
      const { data } = await api.get("/recipes")
      set({ recipes: data, status: "loaded" })
    } catch (error) {
      set({ status: "error", error: apiErrorMessage(error, "Impossible de charger les recettes.") })
    }
  },

  async addRecipe(payload) {
    const { data } = await api.post("/recipes", payload)
    set((state) => ({ recipes: [data, ...state.recipes] }))
    return data
  },

  async updateRecipe(id, patch) {
    const { data } = await api.patch(`/recipes/${id}`, patch)
    set((state) => ({ recipes: state.recipes.map((r) => (r.id === id ? data : r)) }))
    return data
  },

  async deleteRecipe(id) {
    await api.delete(`/recipes/${id}`)
    set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) }))
  },

  async toggleFavorite(id) {
    const { data } = await api.patch(`/recipes/${id}/favorite`)
    set((state) => ({ recipes: state.recipes.map((r) => (r.id === id ? data : r)) }))
  },
}))
