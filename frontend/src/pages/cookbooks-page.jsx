import { Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"

export function CookbooksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cookbooks"
        description="Créez et rejoignez des livres de recettes partagés avec vos proches ou vos collègues."
        action={
          <Button disabled>
            <Plus />
            Nouveau cookbook
          </Button>
        }
      />
      <EmptyState
        icon={Users}
        title="Aucun cookbook pour le moment"
        description="La création de cookbooks, les invitations et les permissions par membre arrivent dans une prochaine étape."
      />
    </div>
  )
}
