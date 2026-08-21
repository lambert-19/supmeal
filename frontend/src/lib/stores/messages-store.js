import { create } from "zustand"

import { api } from "@/lib/api"
import { fetchWithStatus } from "@/lib/stores/store-helpers"

// Un seul jeu de messages en mémoire à la fois (ceux du cookbook actuellement
// affiché) — remplacé intégralement à chaque fetch, pas de cache multi-cookbooks.
export const useMessagesStore = create((set) => ({
  messages: [],
  cookbookId: null,
  status: "idle", // idle | loading | loaded | error
  error: null,

  async fetchByCookbook(cookbookId) {
    await fetchWithStatus(
      set,
      "messages",
      () => api.get(`/cookbooks/${cookbookId}/messages`).then((r) => r.data),
      "Impossible de charger les messages.",
      { cookbookId }
    )
  },

  async addMessage(cookbookId, { text, imageUrl } = {}) {
    const { data } = await api.post(`/cookbooks/${cookbookId}/messages`, { text, imageUrl })
    // Dédoublonné par id : le serveur rediffuse aussi ce message via Socket.io
    // à tous les membres de la room, y compris l'auteur (voir receiveMessage).
    set((state) => (state.messages.some((m) => m.id === data.id) ? state : { messages: [...state.messages, data] }))
    return data
  },

  // Message reçu en temps réel via Socket.io (voir hooks/use-cookbook-messages.js).
  receiveMessage(cookbookId, message) {
    set((state) => {
      if (state.cookbookId !== cookbookId || state.messages.some((m) => m.id === message.id)) return state
      return { messages: [...state.messages, message] }
    })
  },

  // Accusés de réception (livré/lu) reçus via l'event "receipts:update".
  applyReceiptUpdates(updates) {
    set((state) => {
      const byId = new Map(updates.map((u) => [u.messageId, u]))
      if (!state.messages.some((m) => byId.has(m.id))) return state
      return {
        messages: state.messages.map((m) => {
          const update = byId.get(m.id)
          return update ? { ...m, delivered: update.delivered, read: update.read } : m
        }),
      }
    })
  },
}))
