import { Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { CookbookForm } from "@/components/cookbooks/cookbook-form"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useCookbooksStore } from "@/lib/stores/cookbooks-store"
import { getCookbookRole, canManageCookbook } from "@/lib/cookbook-permissions"

export function EditCookbookPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const cookbooks = useCookbooksStore((s) => s.cookbooks)
  const updateCookbook = useCookbooksStore((s) => s.updateCookbook)
  const navigate = useNavigate()

  const cookbook = cookbooks.find((c) => c.id === id)
  const role = cookbook ? getCookbookRole(cookbook, user) : null
  if (!cookbook || !canManageCookbook(role)) return <Navigate to="/cookbooks" replace />

  function onSubmit(values) {
    updateCookbook(id, values)
    toast.success("Cookbook mis à jour.")
    navigate(`/cookbooks/${id}`, { replace: true })
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
