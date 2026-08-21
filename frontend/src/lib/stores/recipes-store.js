import { create } from "zustand"

import { api } from "@/lib/api"
import { fetchWithStatus } from "@/lib/stores/store-helpers"

export const useRecipesStore = create((set) => ({
  recipes: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchAll() {
    await fetchWithStatus(set, "recipes", () => api.get("/recipes").then((r) => r.data), "Impossible de charger les recettes.")
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
