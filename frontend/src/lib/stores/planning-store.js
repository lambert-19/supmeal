import { create } from "zustand"
import { persist } from "zustand/middleware"

import { createId } from "@/lib/stores/store-utils"

export const usePlanningStore = create(
  persist(
    (set) => ({
      entries: [],

      setEntry(ownerId, { date, mealSlot, recipeId }) {
        set((state) => {
          const existingIndex = state.entries.findIndex(
            (entry) => entry.ownerId === ownerId && entry.date === date && entry.mealSlot === mealSlot
          )
          const entry = {
            id: existingIndex === -1 ? createId("planning") : state.entries[existingIndex].id,
            ownerId,
            date,
            mealSlot,
            recipeId,
          }
          if (existingIndex === -1) return { entries: [...state.entries, entry] }
          return { entries: state.entries.map((e, i) => (i === existingIndex ? entry : e)) }
        })
      },

      removeEntry(id) {
        set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }))
      },
    }),
    { name: "supmeal-planning" }
  )
)
