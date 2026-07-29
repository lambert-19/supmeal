import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <p className="font-heading text-6xl font-semibold text-primary">404</p>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Page introuvable</h1>
        <p className="text-sm text-muted-foreground">Cette page n'existe pas ou plus.</p>
      </div>
      <Button render={<Link to="/" />}>Retour à l'accueil</Button>
    </div>
  )
}
