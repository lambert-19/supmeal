import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiErrorMessage } from "@/lib/api"
import { profileSchema } from "@/lib/schemas/settings"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

export function ProfileTab() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const [formError, setFormError] = useState(null)
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await updateProfile(values)
      toast.success("Profil mis à jour.")
    } catch (error) {
      setFormError(apiErrorMessage(error, "Impossible de mettre à jour le profil."))
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
        <FormField id="name" label="Nom" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
      </motion.div>

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="space-y-1.5">
        <Label htmlFor="email">Adresse email</Label>
        <Input id="email" value={user.email} disabled />
        <p className="text-xs text-muted-foreground">
          Le changement d'adresse email n'est pas encore disponible.
        </p>
      </motion.div>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
        <MotionPress>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </MotionPress>
      </motion.div>
    </motion.form>
  )
}
