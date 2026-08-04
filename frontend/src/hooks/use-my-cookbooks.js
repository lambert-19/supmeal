import { useEffect } from "react"

import { useCookbooksStore } from "@/lib/stores/cookbooks-store"

export function useMyCookbooks() {
  const cookbooks = useCookbooksStore((s) => s.cookbooks)
  const status = useCookbooksStore((s) => s.status)
  const fetchAll = useCookbooksStore((s) => s.fetchAll)

  useEffect(() => {
    if (status === "idle") fetchAll()
  }, [status, fetchAll])

  return cookbooks
}
