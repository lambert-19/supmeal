import { z } from "zod"

export const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    newPassword: z.string().min(8, "8 caractères minimum."),
    confirmNewPassword: z.string().min(1, "Merci de confirmer le nouveau mot de passe."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmNewPassword"],
  })

export const preferencesSchema = z.object({
  dietaryRegime: z.string(),
  allergies: z.array(z.string()),
  favoriteCuisine: z.string(),
  defaultServings: z.coerce
    .number({ error: "Merci d'indiquer un nombre." })
    .int("Merci d'indiquer un nombre entier.")
    .min(1, "Minimum 1 portion.")
    .max(20, "Maximum 20 portions."),
})
