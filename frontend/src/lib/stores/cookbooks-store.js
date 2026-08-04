import { create } from "zustand"

import { api, apiErrorMessage } from "@/lib/api"

export const useCookbooksStore = create((set) => ({
  cookbooks: [],
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchAll() {
    set({ status: "loading", error: null })
    try {
      const { data } = await api.get("/cookbooks")
      set({ cookbooks: data, status: "loaded" })
    } catch (error) {
      set({ status: "error", error: apiErrorMessage(error, "Impossible de charger les cookbooks.") })
    }
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
