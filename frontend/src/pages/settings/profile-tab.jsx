import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/form-field"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiErrorMessage } from "@/lib/api"
import { profileSchema } from "@/lib/schemas/settings"

export function ProfileTab() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const [formError, setFormError] = useState(null)

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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <FormField id="name" label="Nom" error={errors.name?.message}>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </FormField>

      <div className="space-y-1.5">
        <Label htmlFor="email">Adresse email</Label>
        <Input id="email" value={user.email} disabled />
        <p className="text-xs text-muted-foreground">
          Le changement d'adresse email n'est pas encore disponible.
        </p>
      </div>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  )
}
