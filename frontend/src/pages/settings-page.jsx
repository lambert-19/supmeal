import { Settings2 } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte, vos connexions OAuth2 et vos préférences culinaires."
      />
      <EmptyState
        icon={Settings2}
        title="Paramètres à venir"
        description="Le changement de mot de passe, la liaison OAuth2 et les préférences culinaires arrivent dans une prochaine étape."
      />
    </div>
  )
}
