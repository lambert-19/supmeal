import { create } from "zustand"

import { api, apiErrorMessage } from "@/lib/api"

// Un seul jeu de messages en mémoire à la fois (ceux du cookbook actuellement
// affiché) — remplacé intégralement à chaque fetch, pas de cache multi-cookbooks.
export const useMessagesStore = create((set) => ({
  messages: [],
  cookbookId: null,
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchByCookbook(cookbookId) {
    set({ status: "loading", error: null, cookbookId })
    try {
      const { data } = await api.get(`/cookbooks/${cookbookId}/messages`)
      set({ messages: data, status: "loaded" })
    } catch (error) {
      set({ status: "error", error: apiErrorMessage(error, "Impossible de charger les messages.") })
    }
  },

  async addMessage(cookbookId, text) {
    const { data } = await api.post(`/cookbooks/${cookbookId}/messages`, { text })
    set((state) => ({ messages: [...state.messages, data] }))
    return data
  },
}))
