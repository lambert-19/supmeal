import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/form-field"
import { TagInput } from "@/components/tag-input"
import { ImageGalleryInput } from "@/components/recipes/image-gallery-input"
import { recipeSchema } from "@/lib/schemas/recipe"
import { TAG_SUGGESTIONS, UNIT_SUGGESTIONS } from "@/lib/constants/recipe"

export function RecipeForm({ defaultValues, onSubmit, submitLabel, secondaryAction }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  })

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: "ingredients" })

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: "steps",
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <Controller
        control={control}
        name="images"
        render={({ field }) => <ImageGalleryInput value={field.value} onChange={field.onChange} />}
      />

      <FormField id="title" label="Titre" error={errors.title?.message}>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="prepTime" label="Préparation (min)" error={errors.prepTime?.message}>
          <Input id="prepTime" type="number" min={0} aria-invalid={!!errors.prepTime} {...register("prepTime")} />
        </FormField>
        <FormField id="cookTime" label="Cuisson (min)" error={errors.cookTime?.message}>
          <Input id="cookTime" type="number" min={0} aria-invalid={!!errors.cookTime} {...register("cookTime")} />
        </FormField>
        <FormField id="servings" label="Portions" error={errors.servings?.message}>
          <Input id="servings" type="number" min={1} max={50} aria-invalid={!!errors.servings} {...register("servings")} />
        </FormField>
      </div>

      <FormField id="tags" label="Catégories / tags">
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              value={field.value}
              onChange={field.onChange}
              suggestions={TAG_SUGGESTIONS}
              placeholder="Ajouter un tag (Entrée, Végétarien...)"
            />
          )}
        />
      </FormField>

      <div className="space-y-2">
        <p className="text-sm font-medium">Ingrédients</p>
        {errors.ingredients?.message && (
          <p className="text-xs text-destructive" role="alert">
            {errors.ingredients.message}
          </p>
        )}
        <div className="space-y-2">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Ingrédient"
                  aria-invalid={!!errors.ingredients?.[index]?.name}
                  {...register(`ingredients.${index}.name`)}
                />
                {errors.ingredients?.[index]?.name && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.ingredients[index].name.message}
                  </p>
                )}
              </div>
              <Input
                placeholder="Quantité"
                className="w-24"
                {...register(`ingredients.${index}.quantity`)}
              />
              <Input
                placeholder="Unité"
                className="w-36"
                list="unit-suggestions"
                {...register(`ingredients.${index}.unit`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIngredient(index)}
                disabled={ingredientFields.length === 1}
                aria-label="Retirer l'ingrédient">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <datalist id="unit-suggestions">
          {UNIT_SUGGESTIONS.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendIngredient({ name: "", quantity: "", unit: "" })}>
          <Plus />
          Ajouter un ingrédient
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Étapes</p>
        {errors.steps?.message && (
          <p className="text-xs text-destructive" role="alert">
            {errors.steps.message}
          </p>
        )}
        <div className="space-y-2">
          {stepFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex-1 space-y-1">
                <Textarea
                  placeholder={`Décrivez l'étape ${index + 1}...`}
                  aria-invalid={!!errors.steps?.[index]?.text}
                  {...register(`steps.${index}.text`)}
                />
                {errors.steps?.[index]?.text && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.steps[index].text.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                disabled={stepFields.length === 1}
                aria-label="Retirer l'étape">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => appendStep({ text: "" })}>
          <Plus />
          Ajouter une étape
        </Button>
      </div>

      <FormField id="source" label="Source (optionnel)" error={errors.source?.message}>
        <Input
          id="source"
          placeholder="URL d'origine ou nom de l'auteur"
          {...register("source")}
        />
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
