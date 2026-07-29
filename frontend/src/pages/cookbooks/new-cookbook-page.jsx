import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { CookbookForm } from "@/components/cookbooks/cookbook-form"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useCookbooksStore } from "@/lib/stores/cookbooks-store"

export function NewCookbookPage() {
  const user = useAuthStore((s) => s.user)
  const addCookbook = useCookbooksStore((s) => s.addCookbook)
  const navigate = useNavigate()

  function onSubmit(values) {
    const cookbook = addCookbook(user.id, values)
    toast.success("Cookbook créé.")
    navigate(`/cookbooks/${cookbook.id}`, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau cookbook" description="Créez un livre de recettes à partager." />
      <CookbookForm
        defaultValues={{ name: "", description: "" }}
        onSubmit={onSubmit}
        submitLabel="Créer le cookbook"
      />
    </div>
  )
}
