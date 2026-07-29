import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ChefHat, Clock, Heart, Pencil, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
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
import { useMyRecipes } from "@/hooks/use-my-recipes"
import { useRecipesStore } from "@/lib/stores/recipes-store"

export function RecipeDetailPage() {
  const { id } = useParams()
  const recipes = useMyRecipes()
  const toggleFavorite = useRecipesStore((s) => s.toggleFavorite)
  const deleteRecipe = useRecipesStore((s) => s.deleteRecipe)
  const navigate = useNavigate()

  const recipe = recipes.find((r) => r.id === id)
  if (!recipe) return <Navigate to="/recipes" replace />

  function handleDelete() {
    deleteRecipe(id)
    toast.success("Recette supprimée.")
    navigate("/recipes", { replace: true })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/recipes" className="text-sm text-muted-foreground hover:underline">
            ← Mes recettes
          </Link>
          <h1 className="font-heading text-2xl font-semibold">{recipe.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite(recipe.id)}
            aria-label={recipe.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
            <Heart className={recipe.favorite ? "size-4 fill-primary text-primary" : "size-4"} />
          </Button>
          <Button
            variant="outline"
            render={<Link to={`/recipes/${recipe.id}/edit`} />}
            nativeButton={false}>
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
                <AlertDialogTitle>Supprimer cette recette ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. « {recipe.title} » sera définitivement
                  supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {recipe.images.length > 0 ? (
        <div className="px-10">
          <Carousel>
            <CarouselContent>
              {recipe.images.map((src, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={src}
                      alt={`${recipe.title} — image ${index + 1}`}
                      className="size-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {recipe.images.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        </div>
      ) : (
        <div className="flex aspect-4/3 w-full items-center justify-center rounded-lg bg-primary/5">
          <ChefHat className="size-10 text-primary/40" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" />
          {recipe.prepTime} min préparation · {recipe.cookTime} min cuisson
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4" />
          {recipe.servings} portions
        </span>
      </div>

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">Ingrédients</h2>
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex gap-2">
              <span className="w-28 shrink-0 text-muted-foreground">
                {[ingredient.quantity, ingredient.unit].filter(Boolean).join(" ")}
              </span>
              <span>{ingredient.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">Étapes</h2>
        <ol className="space-y-3 text-sm">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <p className="pt-0.5">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {recipe.source && (
        <p className="text-sm text-muted-foreground">
          Source : <span className="text-foreground">{recipe.source}</span>
        </p>
      )}
    </div>
  )
}
