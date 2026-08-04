import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, ChevronLeft, ChevronRight, Coffee, Moon, ShoppingCart, Sun, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { PageLoader } from "@/components/page-loader"
import { usePlanningStore } from "@/lib/stores/planning-store"
import { useMyPlanning } from "@/hooks/use-my-planning"
import { useMyRecipes } from "@/hooks/use-my-recipes"
import { apiErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  MEAL_SLOTS,
  WEEKDAY_LABELS,
  addDays,
  formatQuantity,
  formatWeekLabel,
  parseQuantity,
  startOfWeek,
  toISODate,
} from "@/lib/planning"

const DAY_NUMBER_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" })

const MEAL_SLOT_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
}

export function PlanningPage() {
  const setEntry = usePlanningStore((s) => s.setEntry)
  const removeEntry = usePlanningStore((s) => s.removeEntry)
  const status = usePlanningStore((s) => s.status)
  const myRecipes = useMyRecipes()
  const [weekOffset, setWeekOffset] = useState(0)

  const recipesById = useMemo(() => new Map(myRecipes.map((recipe) => [recipe.id, recipe])), [myRecipes])

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekDates = useMemo(() => new Set(days.map(toISODate)), [days])
  const weekStartISO = toISODate(weekStart)
  const weekEndISO = toISODate(addDays(weekStart, 6))
  const entries = useMyPlanning(weekStartISO, weekEndISO)

  const entriesByKey = useMemo(() => {
    const map = new Map()
    entries.forEach((entry) => map.set(`${entry.date}:${entry.mealSlot}`, entry))
    return map
  }, [entries])

  const weekEntries = useMemo(() => entries.filter((entry) => weekDates.has(entry.date)), [entries, weekDates])

  const shoppingList = useMemo(() => {
    const aggregated = new Map()
    weekEntries.forEach((entry) => {
      const recipe = recipesById.get(entry.recipeId)
      if (!recipe) return
      recipe.ingredients.forEach((ingredient) => {
        const key = `${ingredient.name.trim().toLowerCase()}|${ingredient.unit.trim().toLowerCase()}`
        const quantity = parseQuantity(ingredient.quantity)
        const existing = aggregated.get(key)
        if (existing) {
          existing.quantity = existing.quantity != null && quantity != null ? existing.quantity + quantity : null
        } else {
          aggregated.set(key, { name: ingredient.name, unit: ingredient.unit, quantity })
        }
      })
    })
    return Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [weekEntries, recipesById])

  async function handleSetEntry(date, mealSlot, recipeId) {
    try {
      await setEntry({ date, mealSlot, recipeId })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de planifier cette recette."))
    }
  }

  async function handleRemoveEntry(id) {
    try {
      await removeEntry(id)
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de retirer cette entrée."))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning des repas"
        description="Organisez vos recettes sur la semaine et générez vos listes de courses."
        action={
          <Sheet>
            <SheetTrigger render={<Button disabled={weekEntries.length === 0} />}>
              <ShoppingCart />
              Liste de courses
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Liste de courses</SheetTitle>
                <p className="text-sm text-muted-foreground">{formatWeekLabel(weekStart)}</p>
              </SheetHeader>
              <div className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
                {shoppingList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ajoutez des recettes à votre planning pour générer une liste de courses.
                  </p>
                ) : (
                  shoppingList.map((item) => (
                    <div
                      key={`${item.name}-${item.unit}`}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
                      <span>{item.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {item.quantity != null ? `${formatQuantity(item.quantity)} ${item.unit}`.trim() : "quantité variable"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Semaine précédente">
          <ChevronLeft />
        </Button>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{formatWeekLabel(weekStart)}</p>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Aujourd'hui
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Semaine suivante">
          <ChevronRight />
        </Button>
      </div>

      {status === "loading" ? (
        <PageLoader />
      ) : myRecipes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucune recette à planifier"
          description="Créez d'abord une recette pour pouvoir l'ajouter à votre planning."
          action={
            <Button render={<Link to="/recipes/new" />} nativeButton={false}>
              Nouvelle recette
            </Button>
          }
        />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pt-2 pb-3">
          {days.map((day, index) => {
            const dateISO = toISODate(day)
            const isToday = dateISO === toISODate(new Date())
            return (
              <Card
                key={dateISO}
                className={cn("w-64 shrink-0", isToday && "border-primary/40 ring-2 ring-primary/30")}>
                <CardContent className="space-y-5 py-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {WEEKDAY_LABELS[index]}
                    </p>
                    <p className="text-sm font-semibold">{DAY_NUMBER_FORMAT.format(day)}</p>
                  </div>

                  {MEAL_SLOTS.map((slot, slotIndex) => {
                    const entry = entriesByKey.get(`${dateISO}:${slot.value}`)
                    const recipe = entry ? recipesById.get(entry.recipeId) : null
                    const SlotIcon = MEAL_SLOT_ICONS[slot.value]
                    return (
                      <div
                        key={slot.value}
                        className={cn("space-y-2", slotIndex > 0 && "border-t border-border pt-4")}>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <SlotIcon className="size-3.5" />
                          {slot.label}
                        </p>
                        {recipe ? (
                          <div className="flex items-center justify-between gap-1 rounded-lg bg-muted px-2.5 py-2">
                            <Link
                              to={`/recipes/${recipe.id}`}
                              className="truncate text-xs font-medium hover:underline">
                              {recipe.title}
                            </Link>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0"
                              onClick={() => handleRemoveEntry(entry.id)}
                              aria-label={`Retirer ${recipe.title} du ${slot.label.toLowerCase()}`}>
                              <X className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value=""
                            onValueChange={(recipeId) => handleSetEntry(dateISO, slot.value, recipeId)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Ajouter une recette" />
                            </SelectTrigger>
                            <SelectContent>
                              {myRecipes.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
