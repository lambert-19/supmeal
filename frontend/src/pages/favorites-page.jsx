import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Heart, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { useMyRecipes } from "@/hooks/use-my-recipes"

export function FavoritesPage() {
  const recipes = useMyRecipes()
  const favoriteRecipes = useMemo(() => recipes.filter((recipe) => recipe.favorite), [recipes])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favoris"
        description="Retrouvez rapidement les recettes que vous avez marquées comme favorites."
      />

      {favoriteRecipes.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun favori pour le moment"
          description={
            recipes.length === 0
              ? "Créez votre première recette puis marquez-la comme favorite pour la retrouver ici."
              : "Cliquez sur le cœur d'une recette pour la marquer comme favorite."
          }
          action={
            recipes.length === 0 && (
              <Button render={<Link to="/recipes/new" />} nativeButton={false}>
                <UtensilsCrossed />
                Nouvelle recette
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
