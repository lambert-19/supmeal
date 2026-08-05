import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { api, apiErrorMessage } from "@/lib/api"
import { emailOnlySchema, resetPasswordSchema } from "@/lib/schemas/auth"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

function RequestResetForm() {
  const [sent, setSent] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values) {
    try {
      await api.post("/auth/forgot-password", values)
    } catch {
      // La réponse est volontairement générique côté API (anti-énumération des
      // comptes) : on affiche le même message de succès même en cas d'erreur réseau.
    }
    setSent(true)
  }

  if (sent) {
    return (
      <motion.p
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        className="text-sm text-muted-foreground">
        Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
      </motion.p>
    )
  }

  return (
    <motion.form
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate>
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
      <MotionPress className="w-full">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
        </Button>
      </MotionPress>
    </motion.form>
  )
}

function NewPasswordForm({ token }) {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  })
  const passwordValue = watch("newPassword")

  async function onSubmit(values) {
    setFormError(null)
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.newPassword })
      toast.success("Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.")
      navigate("/login", { replace: true })
    } catch (error) {
      setFormError(apiErrorMessage(error, "Lien invalide ou expiré."))
    }
  }

  return (
    <motion.form
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate>
      <FormField id="newPassword" label="Nouveau mot de passe" error={errors.newPassword?.message}>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          aria-invalid={!!errors.newPassword}
          {...register("newPassword")}
        />
        <PasswordStrengthMeter value={passwordValue} />
      </FormField>
      <FormField
        id="confirmNewPassword"
        label="Confirmer le nouveau mot de passe"
        error={errors.confirmNewPassword?.message}>
        <PasswordInput
          id="confirmNewPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmNewPassword}
          {...register("confirmNewPassword")}
        />
      </FormField>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <MotionPress className="w-full">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
        </Button>
      </MotionPress>
    </motion.form>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      className="space-y-6">
      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          {token
            ? "Choisissez un nouveau mot de passe."
            : "Indiquez votre email pour recevoir un lien de réinitialisation."}
        </p>
      </motion.div>

      {token ? <NewPasswordForm token={token} /> : <RequestResetForm />}

      <motion.p
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </motion.p>
    </motion.div>
  )
}
