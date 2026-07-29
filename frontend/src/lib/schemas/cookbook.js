import { z } from "zod"

export const cookbookSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string(),
})

export const inviteMemberSchema = z.object({
  email: z.string().min(1, "Email requis.").email("Email invalide."),
  role: z.enum(["editor", "commentator", "reader"], { error: "Choisissez un rôle." }),
})
