import { Heart } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"

export function FavoritesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Favoris"
        description="Retrouvez rapidement les recettes que vous avez marquées comme favorites."
      />
      <EmptyState
        icon={Heart}
        title="Aucun favori pour le moment"
        description="Marquez une recette comme favorite pour la retrouver ici."
      />
    </div>
  )
}
