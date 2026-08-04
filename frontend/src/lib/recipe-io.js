import Papa from "papaparse"

import { recipeSchema } from "@/lib/schemas/recipe"
import { MAX_IMAGES } from "@/lib/constants/recipe"

const PORTABLE_FIELDS = ["title", "ingredients", "steps", "prepTime", "cookTime", "servings", "tags", "images", "source"]

function toPortable(recipe) {
  const portable = {}
  PORTABLE_FIELDS.forEach((field) => {
    portable[field] = recipe[field]
  })
  return portable
}

function minutesToIsoDuration(minutes) {
  return `PT${minutes || 0}M`
}

function isoDurationToMinutes(duration) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(duration || "")
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  return hours * 60 + minutes
}

export function exportRecipesAsJson(recipes) {
  return JSON.stringify(recipes.map(toPortable), null, 2)
}

export function exportRecipesAsCsv(recipes) {
  const rows = recipes.map((recipe) => ({
    title: recipe.title,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    tags: recipe.tags.join(", "),
    source: recipe.source,
    ingredients: recipe.ingredients
      .map((ingredient) => [ingredient.name, ingredient.quantity, ingredient.unit].join(" | "))
      .join("\n"),
    steps: recipe.steps.map((step) => step.text).join("\n\n"),
  }))
  return Papa.unparse(rows, { columns: ["title", "prepTime", "cookTime", "servings", "tags", "source", "ingredients", "steps"] })
}

export function exportRecipesAsMealie(recipes) {
  return JSON.stringify(
    recipes.map((recipe) => ({
      name: recipe.title,
      description: "",
      recipeYield: `${recipe.servings} portions`,
      prepTime: minutesToIsoDuration(recipe.prepTime),
      performTime: minutesToIsoDuration(recipe.cookTime),
      recipeIngredient: recipe.ingredients.map((ingredient) =>
        [ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")
      ),
      recipeInstructions: recipe.steps.map((step) => ({ text: step.text })),
      tags: recipe.tags.map((tag) => ({ name: tag })),
      orgURL: recipe.source || null,
    })),
    null,
    2
  )
}

function normalizeCandidate(raw) {
  const candidate = {
    title: String(raw.title ?? raw.name ?? "").trim(),
    ingredients: [],
    steps: [],
    prepTime: Number(raw.prepTime) || 0,
    cookTime: Number(raw.cookTime ?? raw.performTime) || 0,
    servings: Number(raw.servings ?? raw.recipeYield) || 1,
    tags: [],
    images: Array.isArray(raw.images) ? raw.images.slice(0, MAX_IMAGES) : [],
    source: String(raw.source ?? raw.orgURL ?? "").trim(),
  }

  if (typeof raw.prepTime === "string" && raw.prepTime.startsWith("PT")) {
    candidate.prepTime = isoDurationToMinutes(raw.prepTime)
  }
  if (typeof raw.performTime === "string" && raw.performTime.startsWith("PT")) {
    candidate.cookTime = isoDurationToMinutes(raw.performTime)
  }

  if (Array.isArray(raw.ingredients)) {
    candidate.ingredients = raw.ingredients.map((ingredient) => ({
      name: String(ingredient.name ?? "").trim(),
      quantity: String(ingredient.quantity ?? ""),
      unit: String(ingredient.unit ?? ""),
    }))
  } else if (Array.isArray(raw.recipeIngredient)) {
    candidate.ingredients = raw.recipeIngredient.map((line) => ({ name: String(line).trim(), quantity: "", unit: "" }))
  } else if (typeof raw.ingredients === "string") {
    candidate.ingredients = raw.ingredients
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, unit] = line.split("|").map((part) => part.trim())
        return { name: name ?? "", quantity: quantity ?? "", unit: unit ?? "" }
      })
  }

  if (Array.isArray(raw.steps)) {
    candidate.steps = raw.steps.map((step) => ({ text: String(step.text ?? step).trim() }))
  } else if (Array.isArray(raw.recipeInstructions)) {
    candidate.steps = raw.recipeInstructions.map((step) => ({ text: String(step.text ?? step).trim() }))
  } else if (typeof raw.steps === "string") {
    candidate.steps = raw.steps
      .split("\n\n")
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ text }))
  }

  if (Array.isArray(raw.tags)) {
    candidate.tags = raw.tags.map((tag) => String(tag.name ?? tag).trim()).filter(Boolean)
  } else if (typeof raw.tags === "string") {
    candidate.tags = raw.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  const yieldMatch = /\d+/.exec(String(raw.recipeYield ?? ""))
  if (yieldMatch) candidate.servings = Number(yieldMatch[0])

  return candidate
}

export function parseImportedFile(text, filename) {
  const isCsv = filename.toLowerCase().endsWith(".csv")
  let rawItems

  if (isCsv) {
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })
    rawItems = data
  } else {
    const parsed = JSON.parse(text)
    rawItems = Array.isArray(parsed) ? parsed : [parsed]
  }

  const recipes = []
  const errors = []

  rawItems.forEach((raw, index) => {
    const candidate = normalizeCandidate(raw)
    const result = recipeSchema.safeParse(candidate)
    if (result.success) {
      recipes.push(result.data)
    } else {
      const label = candidate.title || `élément ${index + 1}`
      errors.push(`« ${label} » ignoré : ${result.error.issues[0]?.message ?? "format invalide"}`)
    }
  })

  return { recipes, errors }
}
