import { create } from "zustand"

import { api } from "@/lib/api"
import { fetchWithStatus } from "@/lib/stores/store-helpers"

export const usePlanningStore = create((set) => ({
  entries: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchRange(from, to) {
    await fetchWithStatus(
      set,
      "entries",
      () => api.get("/planning", { params: { from, to } }).then((r) => r.data),
      "Impossible de charger le planning."
    )
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
