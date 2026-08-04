import { create } from "zustand"
import { persist } from "zustand/middleware"

import { createId } from "@/lib/stores/store-utils"

export const useMessagesStore = create(
  persist(
    (set) => ({
      messages: [],

      addMessage(cookbookId, { authorId, authorName, text }) {
        const message = {
          id: createId("message"),
          cookbookId,
          authorId,
          authorName,
          text,
          createdAt: Date.now(),
        }
        set((state) => ({ messages: [...state.messages, message] }))
        return message
      },
    }),
    { name: "supmeal-messages" }
  )
)
