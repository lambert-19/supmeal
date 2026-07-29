import { Link } from "react-router-dom"
import { Plus, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { useMyRecipes } from "@/hooks/use-my-recipes"

export function RecipesPage() {
  const recipes = useMyRecipes()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes recettes"
        description="Retrouvez, filtrez et planifiez toutes vos recettes."
        action={
          <Button render={<Link to="/recipes/new" />} nativeButton={false}>
            <Plus />
            Nouvelle recette
          </Button>
        }
      />

      {recipes.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Aucune recette pour le moment"
          description="Créez votre première recette pour commencer votre collection."
          action={
            <Button render={<Link to="/recipes/new" />} nativeButton={false}>
              <Plus />
              Nouvelle recette
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
