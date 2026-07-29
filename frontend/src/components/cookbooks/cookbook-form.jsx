import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/form-field"
import { cookbookSchema } from "@/lib/schemas/cookbook"

export function CookbookForm({ defaultValues, onSubmit, submitLabel, secondaryAction }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cookbookSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5" noValidate>
      <FormField id="name" label="Nom du cookbook" error={errors.name?.message}>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
      </FormField>

      <FormField id="description" label="Description (optionnel)" error={errors.description?.message}>
        <Textarea id="description" rows={3} {...register("description")} />
      </FormField>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  )
}
