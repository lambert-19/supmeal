import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "L'adresse email est requise.").email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z.string().min(1, "L'adresse email est requise.").email("Adresse email invalide."),
    password: z.string().min(8, "8 caractères minimum."),
    confirmPassword: z.string().min(1, "Merci de confirmer le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  })
