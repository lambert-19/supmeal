import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { RecipeForm } from "@/components/recipes/recipe-form"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRecipesStore } from "@/lib/stores/recipes-store"

export function NewRecipePage() {
  const user = useAuthStore((s) => s.user)
  const addRecipe = useRecipesStore((s) => s.addRecipe)
  const navigate = useNavigate()

  const defaultValues = {
    title: "",
    ingredients: [{ name: "", quantity: "", unit: "" }],
    steps: [{ text: "" }],
    prepTime: 0,
    cookTime: 0,
    servings: user.preferences.defaultServings,
    tags: [],
    images: [],
    source: "",
  }

  function onSubmit(values) {
    const recipe = addRecipe(user.id, values)
    toast.success("Recette créée.")
    navigate(`/recipes/${recipe.id}`, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle recette"
        description="Ajoutez une recette à votre collection personnelle."
      />
      <RecipeForm defaultValues={defaultValues} onSubmit={onSubmit} submitLabel="Créer la recette" />
    </div>
  )
}
