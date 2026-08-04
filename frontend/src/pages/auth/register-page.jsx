import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { useAuthStore } from "@/lib/stores/auth-store"
import { registerSchema } from "@/lib/schemas/auth"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

export function RegisterPage() {
  const registerUser = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const [authError, setAuthError] = useState(null)
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values) {
    setAuthError(null)
    try {
      await registerUser(values)
      toast.success("Compte créé, bienvenue sur SUPMEAL !")
      navigate("/recipes", { replace: true })
    } catch {
      setAuthError("Un compte existe déjà avec cet email.")
    }
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      className="space-y-6">
      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Commencez à organiser vos recettes en quelques secondes.
        </p>
      </motion.div>

      <motion.form
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate>
        <FormField id="name" label="Nom" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jean Dupont"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField id="email" label="Adresse email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Mot de passe" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </FormField>

        {authError && (
          <p className="text-sm text-destructive" role="alert">
            {authError}
          </p>
        )}

        <MotionPress className="w-full">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </MotionPress>
      </motion.form>

      <motion.p
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </motion.p>
    </motion.div>
  )
}
