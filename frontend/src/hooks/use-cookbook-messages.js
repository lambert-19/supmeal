import { useEffect } from "react"

import { useMessagesStore } from "@/lib/stores/messages-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getSocket } from "@/lib/socket"

export function useCookbookMessages(cookbookId) {
  const messages = useMessagesStore((s) => s.messages)
  const fetchByCookbook = useMessagesStore((s) => s.fetchByCookbook)
  const receiveMessage = useMessagesStore((s) => s.receiveMessage)
  const applyReceiptUpdates = useMessagesStore((s) => s.applyReceiptUpdates)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    const socket = getSocket()

    // Un message qui vient d'arriver côté client (fetch initial ou event
    // temps réel) est immédiatement "livré" ; en plus "lu" seulement si
    // l'onglet est visible à cet instant (voir aussi handleVisibilityChange).
    function markIncoming(messageIds) {
      if (messageIds.length === 0) return
      socket.emit("cookbook:delivered", { cookbookId, messageIds })
      if (document.visibilityState === "visible") {
        socket.emit("cookbook:seen", { cookbookId, messageIds })
      }
    }

    fetchByCookbook(cookbookId).then(() => {
      const ids = useMessagesStore.getState().messages.filter((m) => m.authorId !== userId).map((m) => m.id)
      markIncoming(ids)
    })

    socket.emit("cookbook:join", cookbookId)

    function handleNewMessage(message) {
      receiveMessage(cookbookId, message)
      if (message.authorId !== userId) markIncoming([message.id])
    }
    socket.on("message:new", handleNewMessage)

    function handleReceiptsUpdate(updates) {
      applyReceiptUpdates(updates)
    }
    socket.on("receipts:update", handleReceiptsUpdate)

    // Rattrape les messages livrés-mais-pas-encore-lus quand l'onglet revient
    // au premier plan (ex. ouvert en arrière-plan pendant leur réception).
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return
      const unreadIds = useMessagesStore
        .getState()
        .messages.filter((m) => m.authorId !== userId && m.delivered && !m.read)
        .map((m) => m.id)
      if (unreadIds.length > 0) socket.emit("cookbook:seen", { cookbookId, messageIds: unreadIds })
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      socket.emit("cookbook:leave", cookbookId)
      socket.off("message:new", handleNewMessage)
      socket.off("receipts:update", handleReceiptsUpdate)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [cookbookId, fetchByCookbook, receiveMessage, applyReceiptUpdates, userId])

  return messages
}
