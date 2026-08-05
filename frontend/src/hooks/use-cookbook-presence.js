import { useEffect } from "react"

import { usePresenceStore } from "@/lib/stores/presence-store"
import { getSocket } from "@/lib/socket"

// Rejoint la room de présence du cookbook indépendamment de l'onglet actif
// (Discussion vs Membres) : appelé une fois au niveau de la page détail, pas
// dans CookbookChat, pour ne pas perdre le suivi de présence en changeant
// d'onglet (les TabsContent inactifs sont démontés).
export function useCookbookPresence(cookbookId) {
  const presence = usePresenceStore((s) => s.presence)
  const setSnapshot = usePresenceStore((s) => s.setSnapshot)
  const applyUpdate = usePresenceStore((s) => s.applyUpdate)

  useEffect(() => {
    const socket = getSocket()
    socket.emit("cookbook:join", cookbookId, (snapshot) => {
      if (snapshot) setSnapshot(snapshot)
    })

    function handleUpdate(update) {
      applyUpdate(update)
    }
    socket.on("presence:update", handleUpdate)

    return () => {
      socket.emit("cookbook:leave", cookbookId)
      socket.off("presence:update", handleUpdate)
    }
  }, [cookbookId, setSnapshot, applyUpdate])

  return presence
}
