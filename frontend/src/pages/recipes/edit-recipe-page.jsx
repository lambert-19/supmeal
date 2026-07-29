import { Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { RecipeForm } from "@/components/recipes/recipe-form"
import { useMyRecipes } from "@/hooks/use-my-recipes"
import { useRecipesStore } from "@/lib/stores/recipes-store"

export function EditRecipePage() {
  const { id } = useParams()
  const recipes = useMyRecipes()
  const updateRecipe = useRecipesStore((s) => s.updateRecipe)
  const navigate = useNavigate()

  const recipe = recipes.find((r) => r.id === id)
  if (!recipe) return <Navigate to="/recipes" replace />

  function onSubmit(values) {
    updateRecipe(id, values)
    toast.success("Recette mise à jour.")
    navigate(`/recipes/${id}`, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier la recette" description={recipe.title} />
      <RecipeForm
        defaultValues={recipe}
        onSubmit={onSubmit}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  )
}
