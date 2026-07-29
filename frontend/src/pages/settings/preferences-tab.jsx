import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/form-field"
import { useAuthStore } from "@/lib/stores/auth-store"
import { preferencesSchema } from "@/lib/schemas/settings"
import { CUISINES, DIETARY_REGIMES, ALLERGENS } from "@/lib/constants/preferences"

export function PreferencesTab() {
  const user = useAuthStore((s) => s.user)
  const updatePreferences = useAuthStore((s) => s.updatePreferences)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(preferencesSchema),
    defaultValues: user.preferences,
  })

  async function onSubmit(values) {
    await updatePreferences(values)
    toast.success("Préférences culinaires mises à jour.")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5" noValidate>
      <FormField id="dietaryRegime" label="Régime alimentaire" error={errors.dietaryRegime?.message}>
        <Controller
          control={control}
          name="dietaryRegime"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="dietaryRegime" className="w-full">
                <SelectValue>
                  {(value) => DIETARY_REGIMES.find((option) => option.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIETARY_REGIMES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField id="favoriteCuisine" label="Cuisine préférée" error={errors.favoriteCuisine?.message}>
        <Controller
          control={control}
          name="favoriteCuisine"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="favoriteCuisine" className="w-full">
                <SelectValue>
                  {(value) => CUISINES.find((option) => option.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CUISINES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField
        id="defaultServings"
        label="Nombre de portions par défaut"
        error={errors.defaultServings?.message}>
        <Input
          id="defaultServings"
          type="number"
          min={1}
          max={20}
          className="w-24"
          aria-invalid={!!errors.defaultServings}
          {...register("defaultServings")}
        />
      </FormField>

      <div className="space-y-2">
        <Label>Allergies et intolérances</Label>
        <Controller
          control={control}
          name="allergies"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {ALLERGENS.map((allergen) => {
                const checked = field.value.includes(allergen.value)
                return (
                  <label
                    key={allergen.value}
                    className="flex items-center gap-2 text-sm text-foreground/90">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        field.onChange(
                          isChecked
                            ? [...field.value, allergen.value]
                            : field.value.filter((value) => value !== allergen.value)
                        )
                      }}
                    />
                    {allergen.label}
                  </label>
                )
              })}
            </div>
          )}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Enregistrer les préférences"}
      </Button>
    </form>
  )
}
