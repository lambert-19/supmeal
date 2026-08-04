import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { CookbookForm } from "@/components/cookbooks/cookbook-form"
import { useCookbooksStore } from "@/lib/stores/cookbooks-store"
import { apiErrorMessage } from "@/lib/api"

export function NewCookbookPage() {
  const addCookbook = useCookbooksStore((s) => s.addCookbook)
  const navigate = useNavigate()

  async function onSubmit(values) {
    try {
      const cookbook = await addCookbook(values)
      toast.success("Cookbook créé.")
      navigate(`/cookbooks/${cookbook.id}`, { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de créer le cookbook."))
    }
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
