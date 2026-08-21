import { create } from "zustand"

import { api, apiErrorMessage } from "@/lib/api"

export const useSuggestionsStore = create((set) => ({
  suggestions: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchSuggestions(ingredients = []) {
    set({ status: "loading", error: null })
    try {
      const params = ingredients.length > 0 ? { ingredients: ingredients.join(",") } : {}
      const { data } = await api.get("/recipes/suggestions", { params })
      set({ suggestions: data, status: "loaded" })
    } catch (error) {
      set({ status: "error", error: apiErrorMessage(error, "Impossible de charger les suggestions.") })
    }
  },
}))
