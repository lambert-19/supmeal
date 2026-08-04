import { create } from "zustand"
import { persist } from "zustand/middleware"

import { createId } from "@/lib/stores/store-utils"

const MOCK_USERS_KEY = "supmeal_mock_users"

const DEFAULT_PREFERENCES = {
  dietaryRegime: "none",
  allergies: [],
  favoriteCuisine: "none",
  defaultServings: 4,
}

const DEFAULT_CONNECTIONS = {
  google: false,
  github: false,
}

const DEMO_USER = {
  id: "demo-user",
  name: "Compte de démonstration",
  email: "demo@supmeal.fr",
  password: "supmeal123",
  preferences: { ...DEFAULT_PREFERENCES, dietaryRegime: "vegetarian", favoriteCuisine: "italian", allergies: ["gluten"] },
  connections: { ...DEFAULT_CONNECTIONS, google: true },
}

function readMockUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(MOCK_USERS_KEY))
    if (Array.isArray(stored) && stored.length > 0) return stored
  } catch {
    // ignore malformed storage, fall through to reseed
  }
  const seeded = [DEMO_USER]
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(seeded))
  return seeded
}

function writeMockUsers(users) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

function updateMockUser(id, patch) {
  const users = readMockUsers()
  writeMockUsers(users.map((u) => (u.id === id ? { ...u, ...patch } : u)))
}

function toSafeUser(record) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    preferences: { ...DEFAULT_PREFERENCES, ...record.preferences },
    connections: { ...DEFAULT_CONNECTIONS, ...record.connections },
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function findMockUserByEmail(email) {
  const normalized = email.trim().toLowerCase()
  const user = readMockUsers().find((u) => u.email.toLowerCase() === normalized)
  return user ? { id: user.id, name: user.name, email: user.email } : null
}

export function findMockUserById(id) {
  const user = readMockUsers().find((u) => u.id === id)
  return user ? { id: user.id, name: user.name, email: user.email } : null
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      async login({ email, password }) {
        set({ isLoading: true })
        await wait(400)
        const users = readMockUsers()
        const found = users.find((u) => u.email === email && u.password === password)
        set({ isLoading: false })
        if (!found) throw new Error("invalid_credentials")
        set({ user: toSafeUser(found) })
      },

      async register({ name, email, password }) {
        set({ isLoading: true })
        await wait(400)
        const users = readMockUsers()
        if (users.some((u) => u.email === email)) {
          set({ isLoading: false })
          throw new Error("email_taken")
        }
        const newUser = {
          id: createId("user"),
          name,
          email,
          password,
          preferences: DEFAULT_PREFERENCES,
          connections: DEFAULT_CONNECTIONS,
        }
        writeMockUsers([...users, newUser])
        set({ isLoading: false, user: toSafeUser(newUser) })
      },

      logout() {
        set({ user: null })
      },

      async updateProfile({ name }) {
        const { user } = get()
        if (!user) throw new Error("not_authenticated")
        await wait(300)
        updateMockUser(user.id, { name })
        set({ user: { ...user, name } })
      },

      async changePassword({ currentPassword, newPassword }) {
        const { user } = get()
        if (!user) throw new Error("not_authenticated")
        await wait(300)
        const record = readMockUsers().find((u) => u.id === user.id)
        if (!record || record.password !== currentPassword) {
          throw new Error("invalid_current_password")
        }
        updateMockUser(user.id, { password: newPassword })
      },

      async updatePreferences(preferences) {
        const { user } = get()
        if (!user) throw new Error("not_authenticated")
        await wait(300)
        updateMockUser(user.id, { preferences })
        set({ user: { ...user, preferences } })
      },

      toggleOAuthConnection(provider) {
        const { user } = get()
        if (!user) return
        const connections = { ...user.connections, [provider]: !user.connections[provider] }
        updateMockUser(user.id, { connections })
        set({ user: { ...user, connections } })
      },
    }),
    {
      name: "supmeal-auth",
      partialize: (state) => ({ user: state.user }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...persistedState }
        if (merged.user) merged.user = toSafeUser(merged.user)
        return merged
      },
    }
  )
)
