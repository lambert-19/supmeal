import { CalendarDays } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"

export function PlanningPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning des repas"
        description="Organisez vos recettes sur la semaine et générez vos listes de courses."
      />
      <EmptyState
        icon={CalendarDays}
        title="Aucun planning pour le moment"
        description="La planification hebdomadaire et la génération de listes de courses arrivent dans une prochaine étape."
      />
    </div>
  )
}
