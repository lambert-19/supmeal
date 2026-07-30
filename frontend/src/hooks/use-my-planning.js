import { useMemo } from "react"

import { useAuthStore } from "@/lib/stores/auth-store"
import { usePlanningStore } from "@/lib/stores/planning-store"

export function useMyPlanning() {
  const userId = useAuthStore((s) => s.user?.id)
  const entries = usePlanningStore((s) => s.entries)
  return useMemo(() => entries.filter((entry) => entry.ownerId === userId), [entries, userId])
}
