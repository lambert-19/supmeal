import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { PageLoader } from "@/components/page-loader"
import { CookbookForm } from "@/components/cookbooks/cookbook-form"
import { useCookbooksStore } from "@/lib/stores/cookbooks-store"
import { api, apiErrorMessage } from "@/lib/api"

export function EditCookbookPage() {
  const { id } = useParams()
  // key={id} force un remontage complet si l'id change en restant sur la même
  // route : état de départ frais à chaque montage plutôt qu'un reset via setState
  // synchrone en tête d'effet (déconseillé par eslint-plugin-react-hooks).
  return <EditCookbookForm key={id} id={id} />
}

function EditCookbookForm({ id }) {
  const updateCookbook = useCookbooksStore((s) => s.updateCookbook)
  const navigate = useNavigate()

  const [cookbook, setCookbook] = useState(null)
  const [status, setStatus] = useState("loading") // loading | loaded | not-found

  useEffect(() => {
    let cancelled = false
    api
      .get(`/cookbooks/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setCookbook(data)
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
  // role !== "creator" : seul le créateur peut modifier le cookbook (le serveur
  // revérifie de toute façon, cette redirection évite juste d'afficher le formulaire).
  if (status === "not-found" || cookbook.role !== "creator") return <Navigate to="/cookbooks" replace />

  async function onSubmit(values) {
    try {
      await updateCookbook(id, values)
      toast.success("Cookbook mis à jour.")
      navigate(`/cookbooks/${id}`, { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de mettre à jour le cookbook."))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier le cookbook" description={cookbook.name} />
      <CookbookForm
        defaultValues={{ name: cookbook.name, description: cookbook.description }}
        onSubmit={onSubmit}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  )
}
