import { create } from "zustand"

import { api } from "@/lib/api"
import { fetchWithStatus } from "@/lib/stores/store-helpers"

export const useCookbooksStore = create((set) => ({
  cookbooks: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchAll() {
    await fetchWithStatus(set, "cookbooks", () => api.get("/cookbooks").then((r) => r.data), "Impossible de charger les cookbooks.")
  },

  async addCookbook(payload) {
    const { data } = await api.post("/cookbooks", payload)
    set((state) => ({ cookbooks: [data, ...state.cookbooks] }))
    return data
  },

  async updateCookbook(id, patch) {
    const { data } = await api.patch(`/cookbooks/${id}`, patch)
    set((state) => ({ cookbooks: state.cookbooks.map((c) => (c.id === id ? data : c)) }))
    return data
  },

  async deleteCookbook(id) {
    await api.delete(`/cookbooks/${id}`)
    set((state) => ({ cookbooks: state.cookbooks.filter((c) => c.id !== id) }))
  },
}))
