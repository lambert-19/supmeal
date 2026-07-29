import { useMemo } from "react"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useCookbooksStore } from "@/lib/stores/cookbooks-store"
import { getCookbookRole } from "@/lib/cookbook-permissions"

export function useMyCookbooks() {
  const user = useAuthStore((s) => s.user)
  const cookbooks = useCookbooksStore((s) => s.cookbooks)
  return useMemo(
    () => cookbooks.filter((cookbook) => getCookbookRole(cookbook, user) !== null),
    [cookbooks, user]
  )
}
