import { create } from "zustand"
import { persist } from "zustand/middleware"

import { findMockUserByEmail } from "@/lib/stores/auth-store"
import { createId } from "@/lib/stores/store-utils"

function normalizeCookbook(cookbook) {
  return { description: "", members: [], ...cookbook }
}

export const useCookbooksStore = create(
  persist(
    (set, get) => ({
      cookbooks: [],

      addCookbook(ownerId, data) {
        const cookbook = {
          id: createId("cookbook"),
          ownerId,
          name: data.name,
          description: data.description ?? "",
          members: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({ cookbooks: [cookbook, ...state.cookbooks] }))
        return cookbook
      },

      updateCookbook(id, patch) {
        set((state) => ({
          cookbooks: state.cookbooks.map((cookbook) =>
            cookbook.id === id ? { ...cookbook, ...patch, updatedAt: Date.now() } : cookbook
          ),
        }))
      },

      deleteCookbook(id) {
        set((state) => ({ cookbooks: state.cookbooks.filter((cookbook) => cookbook.id !== id) }))
      },

      inviteMember(cookbookId, { email, role }) {
        const cookbook = get().cookbooks.find((c) => c.id === cookbookId)
        if (!cookbook) return null
        const normalizedEmail = email.trim().toLowerCase()
        const matchedUser = findMockUserByEmail(normalizedEmail)
        const member = {
          userId: matchedUser?.id ?? null,
          email: normalizedEmail,
          name: matchedUser?.name ?? normalizedEmail,
          role,
        }
        const existingIndex = cookbook.members.findIndex((m) => m.email === normalizedEmail)
        const members =
          existingIndex === -1
            ? [...cookbook.members, member]
            : cookbook.members.map((m, i) => (i === existingIndex ? member : m))
        get().updateCookbook(cookbookId, { members })
        return member
      },

      updateMemberRole(cookbookId, memberEmail, role) {
        const cookbook = get().cookbooks.find((c) => c.id === cookbookId)
        if (!cookbook) return
        get().updateCookbook(cookbookId, {
          members: cookbook.members.map((m) => (m.email === memberEmail ? { ...m, role } : m)),
        })
      },

      removeMember(cookbookId, memberEmail) {
        const cookbook = get().cookbooks.find((c) => c.id === cookbookId)
        if (!cookbook) return
        get().updateCookbook(cookbookId, {
          members: cookbook.members.filter((m) => m.email !== memberEmail),
        })
      },
    }),
    {
      name: "supmeal-cookbooks",
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState
        return {
          ...currentState,
          ...persistedState,
          cookbooks: (persistedState.cookbooks ?? []).map(normalizeCookbook),
        }
      },
    }
  )
)
