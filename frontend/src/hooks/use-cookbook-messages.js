import { useMemo } from "react"

import { useMessagesStore } from "@/lib/stores/messages-store"

export function useCookbookMessages(cookbookId) {
  const messages = useMessagesStore((s) => s.messages)
  return useMemo(
    () =>
      messages
        .filter((message) => message.cookbookId === cookbookId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [messages, cookbookId]
  )
}
