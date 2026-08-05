import { create } from "zustand"

import { api } from "@/lib/api"
import { getSocket } from "@/lib/socket"

export const useAuthStore = create((set, get) => ({
  user: null,
  status: "idle", // idle | loading | ready

  async bootstrap() {
    if (get().status !== "idle") return
    set({ status: "loading" })
    try {
      const { data } = await api.get("/auth/me")
      set({ user: data, status: "ready" })
      getSocket().connect()
    } catch {
      set({ user: null, status: "ready" })
    }
  },

  async login({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password })
    set({ user: data })
    getSocket().connect()
  },

  async register({ name, email, password, inviteToken }) {
    await api.post("/auth/register", { name, email, password, inviteToken })
  },

  async logout() {
    await api.post("/auth/logout")
    set({ user: null })
    getSocket().disconnect()
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

  async disconnectOAuthProvider(provider) {
    const { data } = await api.delete(`/users/me/oauth/${provider}`)
    set({ user: data })
  },
}))

window.addEventListener("supmeal:unauthorized", () => {
  useAuthStore.setState({ user: null })
  getSocket().disconnect()
})
