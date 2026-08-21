import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiErrorMessage } from "@/lib/api"
import { passwordSchema } from "@/lib/schemas/settings"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

export function SecurityTab() {
  const changePassword = useAuthStore((s) => s.changePassword)
  const [formError, setFormError] = useState(null)
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  })
  const passwordValue = watch("newPassword")

  async function onSubmit(values) {
    setFormError(null)
    try {
      await changePassword(values)
      toast.success("Mot de passe mis à jour.")
      reset()
    } catch (error) {
      setFormError(apiErrorMessage(error, "Le mot de passe actuel est incorrect."))
    }
  }

  return (
    <motion.form
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-4"
      noValidate>
      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
        <FormField
          id="currentPassword"
          label="Mot de passe actuel"
          error={errors.currentPassword?.message}>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...register("currentPassword")}
          />
        </FormField>
      </motion.div>

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
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
      </motion.div>

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
        <FormField
          id="confirmNewPassword"
          label="Confirmer le nouveau mot de passe"
          error={errors.confirmNewPassword?.message}>
          <PasswordInput
            id="confirmNewPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmNewPassword}
            {...register("confirmNewPassword")}
          />
        </FormField>
      </motion.div>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
        <MotionPress>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
          </Button>
        </MotionPress>
      </motion.div>
    </motion.form>
  )
}
