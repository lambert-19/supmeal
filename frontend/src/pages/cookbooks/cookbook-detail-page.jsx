import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { BookOpen, ChefHat, Pencil, Search, SearchX, Trash2, UserPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoader } from "@/components/page-loader"
import { CookbookChat } from "@/components/cookbooks/cookbook-chat"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FormField } from "@/components/form-field"
import { EmptyState } from "@/components/empty-state"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRecipesStore } from "@/lib/stores/recipes-store"
import { useMyRecipes } from "@/hooks/use-my-recipes"
import { api, apiErrorMessage } from "@/lib/api"
import { canManageCookbook, canEditRecipes, canComment } from "@/lib/cookbook-permissions"
import { COOKBOOK_ROLES } from "@/lib/constants/cookbook"
import { inviteMemberSchema } from "@/lib/schemas/cookbook"

const ROLE_LABELS = {
  creator: "Créateur",
  ...Object.fromEntries(COOKBOOK_ROLES.map((role) => [role.value, role.label])),
}

export function CookbookDetailPage() {
  const { id } = useParams()
  // key={id} force un remontage complet si l'id change en restant sur la même
  // route : état de départ frais à chaque montage plutôt qu'un reset via setState
  // synchrone en tête d'effet (déconseillé par eslint-plugin-react-hooks).
  return <CookbookDetailContent key={id} id={id} />
}

function CookbookDetailContent({ id }) {
  const user = useAuthStore((s) => s.user)
  const fetchRecipes = useRecipesStore((s) => s.fetchAll)
  const myRecipes = useMyRecipes()
  const navigate = useNavigate()

  const [cookbook, setCookbook] = useState(null)
  const [cookbookRecipes, setCookbookRecipes] = useState([])
  const [status, setStatus] = useState("loading") // loading | loaded | not-found

  const [query, setQuery] = useState("")
  const [pendingAdd, setPendingAdd] = useState("")

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "editor" },
  })

  // Réutilisé après chaque mutation (invitation, rôle, retrait de membre/recette)
  // pour rafraîchir le cookbook depuis le serveur plutôt que de recalculer l'état
  // localement — dans un gestionnaire d'event, pas dans un effet.
  async function loadCookbook() {
    const [{ data: cookbookData }, { data: recipesData }] = await Promise.all([
      api.get(`/cookbooks/${id}`),
      api.get(`/cookbooks/${id}/recipes`),
    ])
    setCookbook(cookbookData)
    setCookbookRecipes(recipesData)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([api.get(`/cookbooks/${id}`), api.get(`/cookbooks/${id}/recipes`)])
      .then(([{ data: cookbookData }, { data: recipesData }]) => {
        if (cancelled) return
        setCookbook(cookbookData)
        setCookbookRecipes(recipesData)
        setStatus("loaded")
      })
      .catch(() => {
        if (!cancelled) setStatus("not-found")
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const filteredRecipes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return cookbookRecipes
    return cookbookRecipes.filter((recipe) => {
      const haystack = [recipe.title, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [cookbookRecipes, query])

  const unassignedRecipes = useMemo(() => myRecipes.filter((recipe) => !recipe.cookbookId), [myRecipes])

  if (status === "loading") return <PageLoader />
  if (status === "not-found") return <Navigate to="/cookbooks" replace />

  const role = cookbook.role
  const isCreator = canManageCookbook(role)
  const canEdit = canEditRecipes(role)
  const allMembers = [
    { id: `owner-${cookbook.owner.id}`, userId: cookbook.owner.id, email: cookbook.owner.email, name: cookbook.owner.name, role: "creator", pending: false },
    ...cookbook.members,
  ]

  async function handleDelete() {
    try {
      await api.delete(`/cookbooks/${cookbook.id}`)
      toast.success("Cookbook supprimé.")
      navigate("/cookbooks", { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de supprimer le cookbook."))
    }
  }

  async function onInvite(values) {
    const normalizedEmail = values.email.trim().toLowerCase()
    if (normalizedEmail === user.email.toLowerCase()) {
      toast.error("Vous êtes déjà le créateur de ce cookbook.")
      return
    }
    try {
      const { data: member } = await api.post(`/cookbooks/${cookbook.id}/members`, { ...values, email: normalizedEmail })
      await loadCookbook()
      toast.success(
        member.pending
          ? `Invitation enregistrée pour ${normalizedEmail} (accès dès la création de son compte).`
          : `${member.name} a été ajouté au cookbook.`
      )
      reset({ email: "", role: "editor" })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible d'inviter ce membre."))
    }
  }

  async function handleUpdateMemberRole(memberId, newRole) {
    try {
      await api.patch(`/cookbooks/${cookbook.id}/members/${memberId}`, { role: newRole })
      await loadCookbook()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de modifier le rôle."))
    }
  }

  async function handleRemoveMember(memberId) {
    try {
      await api.delete(`/cookbooks/${cookbook.id}/members/${memberId}`)
      await loadCookbook()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de retirer ce membre."))
    }
  }

  async function handleAddRecipe(recipeId) {
    try {
      await api.post(`/cookbooks/${cookbook.id}/recipes/${recipeId}`)
      await Promise.all([loadCookbook(), fetchRecipes()])
      toast.success("Recette ajoutée au cookbook.")
      setPendingAdd("")
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible d'ajouter cette recette."))
    }
  }

  async function handleRemoveRecipe(recipeId) {
    try {
      await api.delete(`/cookbooks/${cookbook.id}/recipes/${recipeId}`)
      await Promise.all([loadCookbook(), fetchRecipes()])
      toast.success("Recette retirée du cookbook.")
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de retirer cette recette."))
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <Link to="/cookbooks" className="text-sm text-muted-foreground hover:underline">
              ← Cookbooks
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold">{cookbook.name}</h1>
              <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
            </div>
            {cookbook.description && (
              <p className="max-w-md text-sm text-muted-foreground">{cookbook.description}</p>
            )}
          </div>
        </div>

        {isCreator && (
          <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
            <Button variant="outline" render={<Link to={`/cookbooks/${cookbook.id}/edit`} />} nativeButton={false}>
              <Pencil />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" size="icon" />}>
                <Trash2 className="size-4" />
                <span className="sr-only">Supprimer</span>
              </AlertDialogTrigger>
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
          </div>
        )}
      </div>

      <Tabs defaultValue="recipes">
        <TabsList>
          <TabsTrigger value="recipes">Recettes</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="chat">Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-3 pt-4">
        <div className="space-y-2">
          {allMembers.map((member) => {
            const isSelf =
              (member.userId && member.userId === user.id) || member.email.toLowerCase() === user.email.toLowerCase()
            const isOwnerRow = member.role === "creator"
            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {member.name}
                    {isSelf && <span className="text-muted-foreground"> (vous)</span>}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                    {member.pending && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        En attente
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCreator && !isOwnerRow ? (
                    <Select value={member.role} onValueChange={(value) => handleUpdateMemberRole(member.id, value)}>
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue>
                          {(value) => COOKBOOK_ROLES.find((option) => option.value === value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COOKBOOK_ROLES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge>{ROLE_LABELS[member.role]}</Badge>
                  )}
                  {isCreator && !isOwnerRow && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      aria-label={`Retirer ${member.name}`}>
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isCreator && (
          <form
            onSubmit={handleSubmit(onInvite)}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3"
            noValidate>
            <FormField id="invite-email" label="Inviter par email" error={errors.email?.message} className="min-w-48 flex-1">
              <Input id="invite-email" type="email" placeholder="ami@exemple.com" aria-invalid={!!errors.email} {...register("email")} />
            </FormField>
            <FormField id="invite-role" label="Rôle" error={errors.role?.message}>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="invite-role" className="w-40">
                      <SelectValue>
                        {(value) => COOKBOOK_ROLES.find((option) => option.value === value)?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COOKBOOK_ROLES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <Button type="submit" disabled={isSubmitting}>
              <UserPlus />
              Inviter
            </Button>
          </form>
        )}
        </TabsContent>

        <TabsContent value="chat" className="pt-4">
          <CookbookChat cookbookId={cookbook.id} canComment={canComment(role)} />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Recettes ({cookbookRecipes.length})</h2>
          {canEdit && unassignedRecipes.length > 0 && (
            <Select value={pendingAdd} onValueChange={handleAddRecipe}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Ajouter une de mes recettes..." />
              </SelectTrigger>
              <SelectContent>
                {unassignedRecipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {cookbookRecipes.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher dans ce cookbook..."
              className="pl-8"
              aria-label="Rechercher dans ce cookbook"
            />
          </div>
        )}

        {cookbookRecipes.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="Aucune recette dans ce cookbook"
            description={
              canEdit
                ? "Ajoutez une de vos recettes grâce au sélecteur ci-dessus."
                : "Les membres éditeurs peuvent y ajouter des recettes."
            }
          />
        ) : filteredRecipes.length === 0 ? (
          <EmptyState icon={SearchX} title="Aucun résultat" description={`Aucune recette ne correspond à « ${query} ».`} />
        ) : (
          <div className="space-y-2">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden py-0">
                <div className="flex items-center gap-3 p-3">
                  <Link to={`/recipes/${recipe.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="aspect-4/3 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {recipe.images[0] ? (
                        <img src={recipe.images[0]} alt={recipe.title} className="size-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ChefHat className="size-4 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{recipe.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {recipe.prepTime + recipe.cookTime} min · {recipe.servings} portions
                      </p>
                    </div>
                  </Link>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipe(recipe.id)}
                      aria-label="Retirer du cookbook">
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
