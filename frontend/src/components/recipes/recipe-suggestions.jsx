import { useState } from "react"
import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/empty-state"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { useRecipeSuggestions } from "@/hooks/use-recipe-suggestions"

export function RecipeSuggestions({ title = "Suggestions pour vous", compact = false }) {
  const [ingredientsText, setIngredientsText] = useState("")
  const [appliedIngredients, setAppliedIngredients] = useState([])
  const { suggestions, status } = useRecipeSuggestions(appliedIngredients)

  function handleSubmit(event) {
    event.preventDefault()
    setAppliedIngredients(
      ingredientsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  }

  if (compact && status === "loaded" && suggestions.length === 0 && appliedIngredients.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <Sparkles className="size-4 text-primary" />
          {title}
        </h2>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Label htmlFor="suggestion-ingredients" className="sr-only">
            Ingrédients sous la main
          </Label>
          <Input
            id="suggestion-ingredients"
            value={ingredientsText}
            onChange={(event) => setIngredientsText(event.target.value)}
            placeholder="Ingrédients sous la main (riz, tomate...)"
            className="h-8 w-56 text-xs sm:w-64"
          />
          <Button type="submit" size="sm" variant="outline">
            Filtrer
          </Button>
        </form>
      </div>

      {status === "loading" ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Recherche des meilleures recettes pour vous…</p>
      ) : status === "error" ? (
        <p className="py-6 text-center text-sm text-destructive">Impossible de charger les suggestions.</p>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Pas encore de suggestion"
          description="Créez des recettes, renseignez vos préférences culinaires dans les paramètres, ou essayez d'autres ingrédients."
        />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {suggestions.map((recipe) => (
            <div key={recipe.id} className="w-56 shrink-0 space-y-1.5">
              <RecipeCard recipe={recipe} />
              {recipe.reasons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.reasons.map((reason) => (
                    <Badge key={reason} variant="outline" className="text-[10px] font-normal">
                      {reason}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
