import { Plus, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"

export function RecipesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes recettes"
        description="Retrouvez, filtrez et planifiez toutes vos recettes."
        action={
          <Button disabled>
            <Plus />
            Nouvelle recette
          </Button>
        }
      />
      <EmptyState
        icon={UtensilsCrossed}
        title="Aucune recette pour le moment"
        description="La création, l'import et le filtrage des recettes arrivent dans une prochaine étape."
      />
    </div>
  )
}
