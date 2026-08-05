import { create } from "zustand"

// Présence en ligne des utilisateurs, alimentée par Socket.io (voir
// hooks/use-cookbook-presence.js) — pas d'appel HTTP dédié, tout passe par le
// snapshot reçu au join d'une room de cookbook + les events presence:update.
export const usePresenceStore = create((set) => ({
  presence: {}, // { [userId]: { online: boolean, lastSeenAt: string|null } }

  setSnapshot(snapshot) {
    set((state) => ({ presence: { ...state.presence, ...snapshot } }))
  },

  applyUpdate({ userId, online, lastSeenAt }) {
    set((state) => ({ presence: { ...state.presence, [userId]: { online, lastSeenAt } } }))
  },
}))
