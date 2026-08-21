import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { cookbookSchema } from "@/lib/schemas/cookbook"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

export function CookbookForm({ defaultValues, onSubmit, submitLabel, secondaryAction }) {
  const prefersReducedMotion = useReducedMotion()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cookbookSchema),
    defaultValues,
  })

  return (
    <motion.form
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-5"
      noValidate>
      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
        <FormField id="name" label="Nom du cookbook" error={errors.name?.message}>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
      </motion.div>

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
        <FormField id="description" label="Description (optionnel)" error={errors.description?.message}>
          <Textarea id="description" rows={3} {...register("description")} />
        </FormField>
      </motion.div>

      <motion.div
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        className="flex items-center gap-2">
        <MotionPress>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : submitLabel}
          </Button>
        </MotionPress>
        {secondaryAction}
      </motion.div>
    </motion.form>
  )
}
