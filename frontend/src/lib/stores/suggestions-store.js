import { create } from "zustand"

import { api } from "@/lib/api"
import { fetchWithStatus } from "@/lib/stores/store-helpers"

export const useSuggestionsStore = create((set) => ({
  suggestions: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchSuggestions(ingredients = []) {
    const params = ingredients.length > 0 ? { ingredients: ingredients.join(",") } : {}
    await fetchWithStatus(
      set,
      "suggestions",
      () => api.get("/recipes/suggestions", { params }).then((r) => r.data),
      "Impossible de charger les suggestions."
    )
  },
}))
