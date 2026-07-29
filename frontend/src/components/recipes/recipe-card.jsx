import { Link } from "react-router-dom"
import { ChefHat, Clock, Heart, Images, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRecipesStore } from "@/lib/stores/recipes-store"

const MAX_VISIBLE_TAGS = 3

export function RecipeCard({ recipe }) {
  const toggleFavorite = useRecipesStore((s) => s.toggleFavorite)
  const totalTime = recipe.prepTime + recipe.cookTime
  const visibleTags = recipe.tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenTagCount = recipe.tags.length - visibleTags.length

  return (
    <Card className="group/recipe-card relative overflow-hidden py-0">
      <Link to={`/recipes/${recipe.id}`} className="block">
        <div className="relative aspect-4/3 bg-muted">
          {recipe.images.length > 0 ? (
            <img src={recipe.images[0]} alt={recipe.title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary/5">
              <ChefHat className="size-8 text-primary/40" />
            </div>
          )}
          {recipe.images.length > 1 && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              <Images className="size-3" />
              {recipe.images.length}
            </span>
          )}
        </div>
      </Link>

      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="absolute top-2 right-2"
        onClick={() => toggleFavorite(recipe.id)}
        aria-label={recipe.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
        <Heart className={recipe.favorite ? "size-4 fill-primary text-primary" : "size-4"} />
      </Button>

      <CardContent className="space-y-2 py-4">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-heading text-sm font-semibold hover:underline">{recipe.title}</h3>
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {recipe.servings}
          </span>
        </div>

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {hiddenTagCount > 0 && <Badge variant="secondary">+{hiddenTagCount}</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
