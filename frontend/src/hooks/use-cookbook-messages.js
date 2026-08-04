import { useEffect } from "react"

import { useMessagesStore } from "@/lib/stores/messages-store"

export function useCookbookMessages(cookbookId) {
  const messages = useMessagesStore((s) => s.messages)
  const fetchByCookbook = useMessagesStore((s) => s.fetchByCookbook)

  useEffect(() => {
    fetchByCookbook(cookbookId)
  }, [cookbookId, fetchByCookbook])

  return messages
}
