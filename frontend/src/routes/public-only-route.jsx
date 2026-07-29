import { Navigate } from "react-router-dom"

import { useAuthStore } from "@/lib/stores/auth-store"

export function PublicOnlyRoute({ children }) {
  const user = useAuthStore((s) => s.user)

  if (user) {
    return <Navigate to="/recipes" replace />
  }

  return children
}
