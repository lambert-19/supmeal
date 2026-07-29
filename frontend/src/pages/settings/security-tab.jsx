import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/form-field"
import { useAuthStore } from "@/lib/stores/auth-store"
import { passwordSchema } from "@/lib/schemas/settings"

export function SecurityTab() {
  const changePassword = useAuthStore((s) => s.changePassword)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await changePassword(values)
      toast.success("Mot de passe mis à jour.")
      reset()
    } catch {
      setFormError("Le mot de passe actuel est incorrect.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <FormField
        id="currentPassword"
        label="Mot de passe actuel"
        error={errors.currentPassword?.message}>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          {...register("currentPassword")}
        />
      </FormField>

      <FormField id="newPassword" label="Nouveau mot de passe" error={errors.newPassword?.message}>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          aria-invalid={!!errors.newPassword}
          {...register("newPassword")}
        />
      </FormField>

      <FormField
        id="confirmNewPassword"
        label="Confirmer le nouveau mot de passe"
        error={errors.confirmNewPassword?.message}>
        <Input
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmNewPassword}
          {...register("confirmNewPassword")}
        />
      </FormField>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
      </Button>
    </form>
  )
}
