import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Heart, Plus, SearchX, UtensilsCrossed, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { MotionPress } from "@/components/motion-press"
import { PageLoader } from "@/components/page-loader"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { RecipeImportExport } from "@/components/recipes/recipe-import-export"
import { RecipeSuggestions } from "@/components/recipes/recipe-suggestions"
import { useMyRecipes } from "@/hooks/use-my-recipes"
import { useRecipesStore } from "@/lib/stores/recipes-store"
import { cn } from "@/lib/utils"
import { GRID_CONTAINER_VARIANTS, GRID_ITEM_VARIANTS } from "@/lib/motion-variants"

const TIME_FILTERS = [
  { value: "all", label: "Toutes durées" },
  { value: "15", label: "15 min ou moins" },
  { value: "30", label: "30 min ou moins" },
  { value: "60", label: "60 min ou moins" },
  { value: "60+", label: "Plus d'1 heure" },
]

export function RecipesPage() {
  const recipes = useMyRecipes()
  const status = useRecipesStore((s) => s.status)
  const prefersReducedMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const [timeFilter, setTimeFilter] = useState("all")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])

  const query = searchParams.get("q") ?? ""

  const allTags = useMemo(() => {
    const tags = new Set()
    recipes.forEach((recipe) => recipe.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (favoritesOnly && !recipe.favorite) return false
      if (selectedTags.length > 0 && !selectedTags.every((tag) => recipe.tags.includes(tag))) return false

      const totalTime = recipe.prepTime + recipe.cookTime
      if (timeFilter === "15" && totalTime > 15) return false
      if (timeFilter === "30" && totalTime > 30) return false
      if (timeFilter === "60" && totalTime > 60) return false
      if (timeFilter === "60+" && totalTime <= 60) return false

      if (normalizedQuery) {
        const haystack = [recipe.title, recipe.source, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }

      return true
    })
  }, [recipes, query, favoritesOnly, selectedTags, timeFilter])

  const hasActiveFilters = Boolean(query) || favoritesOnly || selectedTags.length > 0 || timeFilter !== "all"

  function toggleTag(tag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function resetFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete("q")
      return next
    })
    setTimeFilter("all")
    setFavoritesOnly(false)
    setSelectedTags([])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes recettes"
        description="Retrouvez, filtrez et planifiez toutes vos recettes."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RecipeImportExport />
            <MotionPress>
              <Button render={<Link to="/recipes/new" />} nativeButton={false}>
                <Plus />
                Nouvelle recette
              </Button>
            </MotionPress>
          </div>
        }
      />

      {recipes.length > 0 && <RecipeSuggestions compact />}

      {recipes.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue>{(value) => TIME_FILTERS.find((option) => option.value === value)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge
              render={<button type="button" />}
              variant={favoritesOnly ? "default" : "outline"}
              className="h-8 cursor-pointer px-3"
              onClick={() => setFavoritesOnly((prev) => !prev)}>
              <Heart className={cn("size-3.5", favoritesOnly && "fill-current")} />
              Favoris uniquement
            </Badge>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
                <X />
                Réinitialiser les filtres
              </Button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  render={<button type="button" />}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "loading" ? (
        <PageLoader />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Aucune recette pour le moment"
          description="Créez votre première recette pour commencer votre collection."
          action={
            <Button render={<Link to="/recipes/new" />} nativeButton={false}>
              <Plus />
              Nouvelle recette
            </Button>
          }
        />
      ) : filteredRecipes.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun résultat"
          description="Aucune recette ne correspond à votre recherche ou à vos filtres."
          action={
            <Button type="button" variant="outline" onClick={resetFilters}>
              <X />
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <motion.div
          variants={prefersReducedMotion ? undefined : GRID_CONTAINER_VARIANTS}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "show"}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <motion.div key={recipe.id} variants={prefersReducedMotion ? undefined : GRID_ITEM_VARIANTS}>
              <RecipeCard recipe={recipe} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
