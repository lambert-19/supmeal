import { useEffect } from "react"

import { useSuggestionsStore } from "@/lib/stores/suggestions-store"

export function useRecipeSuggestions(ingredients = []) {
  const suggestions = useSuggestionsStore((s) => s.suggestions)
  const status = useSuggestionsStore((s) => s.status)
  const fetchSuggestions = useSuggestionsStore((s) => s.fetchSuggestions)

  const ingredientsKey = ingredients.join(",")

  useEffect(() => {
    fetchSuggestions(ingredientsKey ? ingredientsKey.split(",") : [])
  }, [ingredientsKey, fetchSuggestions])

  return { suggestions, status }
}
