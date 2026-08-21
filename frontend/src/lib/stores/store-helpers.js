import { apiErrorMessage } from "@/lib/api"

// Factorise le pattern loading/error répété dans les stores (recipes, cookbooks,
// planning, suggestions, comments, messages) : pose "loading", exécute la requête,
// range le résultat sous `key` ou bascule en "error" avec un message localisé.
export async function fetchWithStatus(set, key, request, errorMessage, extraLoadingState = {}) {
  set({ status: "loading", error: null, ...extraLoadingState })
  try {
    const data = await request()
    set({ [key]: data, status: "loaded" })
    return data
  } catch (error) {
    set({ status: "error", error: apiErrorMessage(error, errorMessage) })
  }
}
