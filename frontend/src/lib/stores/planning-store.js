import { create } from "zustand"

import { api, apiErrorMessage } from "@/lib/api"

export const usePlanningStore = create((set) => ({
  entries: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchRange(from, to) {
    set({ status: "loading", error: null })
    try {
      const { data } = await api.get("/planning", { params: { from, to } })
      set({ entries: data, status: "loaded" })
    } catch (error) {
      set({ status: "error", error: apiErrorMessage(error, "Impossible de charger le planning.") })
    }
  },

  async setEntry(payload) {
    const { data } = await api.put("/planning", payload)
    set((state) => ({
      entries: [
        ...state.entries.filter((entry) => !(entry.date === data.date && entry.mealSlot === data.mealSlot)),
        data,
      ],
    }))
    return data
  },

  async removeEntry(id) {
    await api.delete(`/planning/${id}`)
    set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }))
  },
}))
