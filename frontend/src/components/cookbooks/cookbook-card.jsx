import { Link } from "react-router-dom"
import { BookOpen, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useCookbookRecipes } from "@/hooks/use-cookbook-recipes"
import { getCookbookRole } from "@/lib/cookbook-permissions"
import { COOKBOOK_ROLES } from "@/lib/constants/cookbook"

const ROLE_LABELS = {
  creator: "Créateur",
  ...Object.fromEntries(COOKBOOK_ROLES.map((role) => [role.value, role.label])),
}

export function CookbookCard({ cookbook }) {
  const user = useAuthStore((s) => s.user)
  const recipes = useCookbookRecipes(cookbook.id)
  const role = getCookbookRole(cookbook, user)
  const memberCount = cookbook.members.length + 1

  return (
    <Card className="h-full transition-colors hover:border-primary/40">
      <Link to={`/cookbooks/${cookbook.id}`} className="block h-full">
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            {role && <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>}
          </div>

          <div className="space-y-1">
            <h3 className="font-heading text-sm font-semibold">{cookbook.name}</h3>
            {cookbook.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">{cookbook.description}</p>
            )}
          </div>

          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {memberCount} membre{memberCount > 1 ? "s" : ""}
            </span>
            <span>
              {recipes.length} recette{recipes.length > 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
