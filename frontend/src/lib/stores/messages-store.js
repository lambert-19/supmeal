import { create } from "zustand"
import { persist } from "zustand/middleware"

function createId() {
  return `message-${Math.random().toString(36).slice(2, 10)}`
}

export const useMessagesStore = create(
  persist(
    (set) => ({
      messages: [],

      addMessage(cookbookId, { authorId, authorName, text }) {
        const message = {
          id: createId(),
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
