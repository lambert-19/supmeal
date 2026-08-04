import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { CookbookCard } from "@/components/cookbooks/cookbook-card"
import { useMyCookbooks } from "@/hooks/use-my-cookbooks"
import { GRID_CONTAINER_VARIANTS, GRID_ITEM_VARIANTS } from "@/lib/motion-variants"

export function CookbooksPage() {
  const cookbooks = useMyCookbooks()
  const prefersReducedMotion = useReducedMotion()

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
        <motion.div
          variants={prefersReducedMotion ? undefined : GRID_CONTAINER_VARIANTS}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "show"}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cookbooks.map((cookbook) => (
            <motion.div key={cookbook.id} variants={prefersReducedMotion ? undefined : GRID_ITEM_VARIANTS}>
              <CookbookCard cookbook={cookbook} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
