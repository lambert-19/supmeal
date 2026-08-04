import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { PageLoader } from "@/components/page-loader"
import { RecipeForm } from "@/components/recipes/recipe-form"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRecipesStore } from "@/lib/stores/recipes-store"
import { api, apiErrorMessage } from "@/lib/api"

export function EditRecipePage() {
  const { id } = useParams()
  // key={id} force un remontage complet si l'id change (navigation directe d'une
  // fiche d'édition à une autre) : évite d'avoir à réinitialiser le state à la main
  // dans l'effet ci-dessous (setState synchrone en tête d'effet, déconseillé par
  // eslint-plugin-react-hooks — l'état de départ frais suffit à chaque montage).
  return <EditRecipeForm key={id} id={id} />
}

function EditRecipeForm({ id }) {
  const user = useAuthStore((s) => s.user)
  const updateRecipe = useRecipesStore((s) => s.updateRecipe)
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState(null)
  const [status, setStatus] = useState("loading") // loading | loaded | not-found

  useEffect(() => {
    let cancelled = false
    api
      .get(`/recipes/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setRecipe(data)
          setStatus("loaded")
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("not-found")
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (status === "loading") return <PageLoader />
  if (status === "not-found" || recipe.ownerId !== user.id) return <Navigate to="/recipes" replace />

  async function onSubmit(values) {
    try {
      await updateRecipe(id, values)
      toast.success("Recette mise à jour.")
      navigate(`/recipes/${id}`, { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de mettre à jour la recette."))
    }
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
