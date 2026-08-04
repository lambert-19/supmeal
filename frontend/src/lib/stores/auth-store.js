import { create } from "zustand"

import { api } from "@/lib/api"

const DEFAULT_CONNECTIONS = {
  google: false,
  github: false,
}

export const useAuthStore = create((set, get) => ({
  user: null,
  status: "idle", // idle | loading | ready

  async bootstrap() {
    if (get().status !== "idle") return
    set({ status: "loading" })
    try {
      const { data } = await api.get("/auth/me")
      set({ user: data, status: "ready" })
    } catch {
      set({ user: null, status: "ready" })
    }
  },

  async login({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password })
    set({ user: data })
  },

  async register({ name, email, password, inviteToken }) {
    await api.post("/auth/register", { name, email, password, inviteToken })
  },

  async logout() {
    await api.post("/auth/logout")
    set({ user: null })
  },

  async updateProfile(values) {
    const { data } = await api.patch("/users/me", values)
    set({ user: data })
  },

  async changePassword(values) {
    await api.patch("/users/me/password", values)
  },

  async updatePreferences(preferences) {
    const { data } = await api.patch("/users/me/preferences", preferences)
    set({ user: data })
  },

  // Pas de flux OAuth2 réel côté serveur pour l'instant (voir backend/README.md
  // "À venir") : bascule purement locale, ne survit pas à un rechargement.
  toggleOAuthConnection(provider) {
    const { user } = get()
    if (!user) return
    const connections = { ...(user.connections ?? DEFAULT_CONNECTIONS), [provider]: !user.connections?.[provider] }
    set({ user: { ...user, connections } })
  },
}))

window.addEventListener("supmeal:unauthorized", () => {
  useAuthStore.setState({ user: null })
})
