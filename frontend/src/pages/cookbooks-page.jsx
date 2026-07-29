import { Link } from "react-router-dom"
import { Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { CookbookCard } from "@/components/cookbooks/cookbook-card"
import { useMyCookbooks } from "@/hooks/use-my-cookbooks"

export function CookbooksPage() {
  const cookbooks = useMyCookbooks()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cookbooks"
        description="Créez et rejoignez des livres de recettes partagés avec vos proches ou vos collègues."
        action={
          <Button render={<Link to="/cookbooks/new" />} nativeButton={false}>
            <Plus />
            Nouveau cookbook
          </Button>
        }
      />

      {cookbooks.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun cookbook pour le moment"
          description="Créez votre premier cookbook pour partager des recettes avec d'autres personnes."
          action={
            <Button render={<Link to="/cookbooks/new" />} nativeButton={false}>
              <Plus />
              Nouveau cookbook
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cookbooks.map((cookbook) => (
            <CookbookCard key={cookbook.id} cookbook={cookbook} />
          ))}
        </div>
      )}
    </div>
  )
}
