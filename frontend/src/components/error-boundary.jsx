import { Component } from "react"
import { TriangleAlert } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

export class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("Uncaught error:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh items-center justify-center p-6">
          <EmptyState
            icon={TriangleAlert}
            title="Une erreur est survenue"
            description="Quelque chose s'est mal passé. Essayez de recharger la page."
            action={<Button onClick={() => window.location.reload()}>Recharger la page</Button>}
          />
        </div>
      )
    }
    return this.props.children
  }
}
