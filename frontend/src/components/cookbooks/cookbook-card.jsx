import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, MoreVertical, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useCookbooksStore } from "@/lib/stores/cookbooks-store"
import { apiErrorMessage } from "@/lib/api"
import { getCookbookRole, canManageCookbook } from "@/lib/cookbook-permissions"
import { COOKBOOK_ROLES } from "@/lib/constants/cookbook"

const ROLE_LABELS = {
  creator: "Créateur",
  ...Object.fromEntries(COOKBOOK_ROLES.map((role) => [role.value, role.label])),
}

export function CookbookCard({ cookbook }) {
  const user = useAuthStore((s) => s.user)
  const deleteCookbook = useCookbooksStore((s) => s.deleteCookbook)
  const role = getCookbookRole(cookbook, user)
  const isCreator = canManageCookbook(role)
  const memberCount = cookbook.members.length + 1
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteCookbook(cookbook.id)
      toast.success("Cookbook supprimé.")
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de supprimer le cookbook."))
    }
  }

  return (
    <Card className="relative h-full transition-colors hover:border-primary/40">
      <Link to={`/cookbooks/${cookbook.id}`} className="block h-full">
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            {role && <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>}
          </div>

          <div className="space-y-1 pr-6">
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
              {cookbook.recipesCount} recette{cookbook.recipesCount > 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Link>

      {isCreator && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  aria-label={`Actions pour ${cookbook.name}`}
                  onClick={(event) => event.preventDefault()}
                />
              }>
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/cookbooks/${cookbook.id}/edit`)}>
                <Pencil />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce cookbook ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. « {cookbook.name} » et son partage avec les membres seront
                  supprimés (les recettes elles-mêmes ne sont pas supprimées).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </Card>
  )
}
