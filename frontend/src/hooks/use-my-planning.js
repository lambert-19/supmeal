import { useEffect } from "react"

import { usePlanningStore } from "@/lib/stores/planning-store"

export function useMyPlanning(from, to) {
  const entries = usePlanningStore((s) => s.entries)
  const fetchRange = usePlanningStore((s) => s.fetchRange)

  useEffect(() => {
    fetchRange(from, to)
  }, [from, to, fetchRange])

  return entries
}
