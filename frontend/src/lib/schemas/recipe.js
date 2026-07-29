import { z } from "zod"

import { MAX_IMAGES } from "@/lib/constants/recipe"

const ingredientSchema = z.object({
  name: z.string().min(1, "Nom requis."),
  quantity: z.string(),
  unit: z.string(),
})

const stepSchema = z.object({
  text: z.string().min(1, "L'étape ne peut pas être vide."),
})

export const recipeSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères."),
  ingredients: z.array(ingredientSchema).min(1, "Ajoutez au moins un ingrédient."),
  steps: z.array(stepSchema).min(1, "Ajoutez au moins une étape."),
  prepTime: z.coerce
    .number({ error: "Merci d'indiquer un nombre." })
    .int("Nombre entier requis.")
    .min(0, "Doit être positif ou nul."),
  cookTime: z.coerce
    .number({ error: "Merci d'indiquer un nombre." })
    .int("Nombre entier requis.")
    .min(0, "Doit être positif ou nul."),
  servings: z.coerce
    .number({ error: "Merci d'indiquer un nombre." })
    .int("Nombre entier requis.")
    .min(1, "Minimum 1 portion.")
    .max(50, "Maximum 50 portions."),
  tags: z.array(z.string()),
  images: z.array(z.string()).max(MAX_IMAGES, `${MAX_IMAGES} images maximum.`),
  source: z.string(),
})
