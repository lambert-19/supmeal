import { PageHeader } from "@/components/page-header"
import { RecipeSuggestions } from "@/components/recipes/recipe-suggestions"

export function SuggestionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Suggestions"
        description="Des recettes de votre collection choisies pour vous selon vos préférences, votre planning et vos favoris."
      />

      <RecipeSuggestions title="Recettes suggérées" />
    </div>
  )
}
