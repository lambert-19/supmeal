import { create } from "zustand"
import { persist } from "zustand/middleware"

const MOCK_USERS_KEY = "supmeal_mock_users"
const DEMO_USER = {
  id: "demo-user",
  name: "Compte de démonstration",
  email: "demo@supmeal.fr",
  password: "supmeal123",
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      async login({ email, password }) {
        set({ isLoading: true })
        await wait(400)
        const users = readMockUsers()
        const found = users.find((u) => u.email === email && u.password === password)
        set({ isLoading: false })
        if (!found) throw new Error("invalid_credentials")
        const { password: _password, ...safeUser } = found
        set({ user: safeUser })
      },

      async register({ name, email, password }) {
        set({ isLoading: true })
        await wait(400)
        const users = readMockUsers()
        if (users.some((u) => u.email === email)) {
          set({ isLoading: false })
          throw new Error("email_taken")
        }
        const newUser = { id: `user-${Math.random().toString(36).slice(2, 10)}`, name, email, password }
        writeMockUsers([...users, newUser])
        set({ isLoading: false, user: { id: newUser.id, name, email } })
      },

      logout() {
        set({ user: null })
      },
    }),
    {
      name: "supmeal-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
)
