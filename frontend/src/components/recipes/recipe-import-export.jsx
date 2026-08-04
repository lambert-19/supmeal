import { useRef, useState } from "react"
import { saveAs } from "file-saver"
import { toast } from "sonner"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRecipesStore } from "@/lib/stores/recipes-store"
import { useMyRecipes } from "@/hooks/use-my-recipes"
import { exportRecipesAsCsv, exportRecipesAsJson, exportRecipesAsMealie, parseImportedFile } from "@/lib/recipe-io"

function download(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  saveAs(blob, filename)
}

export function RecipeImportExport() {
  const user = useAuthStore((s) => s.user)
  const addRecipe = useRecipesStore((s) => s.addRecipe)
  const recipes = useMyRecipes()
  const fileInputRef = useRef(null)
  const [selectedIds, setSelectedIds] = useState([])

  function handleSheetOpenChange(open) {
    if (open) setSelectedIds(recipes.map((recipe) => recipe.id))
  }

  function toggleRecipe(recipeId) {
    setSelectedIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    )
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.length === recipes.length ? [] : recipes.map((recipe) => recipe.id)))
  }

  function handleExport(format) {
    const toExport = recipes.filter((recipe) => selectedIds.includes(recipe.id))
    if (toExport.length === 0) {
      toast.error("Sélectionnez au moins une recette à exporter.")
      return
    }
    if (format === "json") {
      download(exportRecipesAsJson(toExport), "supmeal-recettes.json", "application/json")
    } else if (format === "csv") {
      download(exportRecipesAsCsv(toExport), "supmeal-recettes.csv", "text/csv")
    } else if (format === "mealie") {
      download(exportRecipesAsMealie(toExport), "supmeal-recettes-mealie.json", "application/json")
    }
    toast.success(`${toExport.length} recette${toExport.length > 1 ? "s" : ""} exportée${toExport.length > 1 ? "s" : ""}.`)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const text = await file.text()
      const { recipes: imported, errors } = parseImportedFile(text, file.name)
      imported.forEach((data) => addRecipe(user.id, data))

      if (imported.length > 0) {
        toast.success(`${imported.length} recette${imported.length > 1 ? "s" : ""} importée${imported.length > 1 ? "s" : ""}.`)
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} élément(s) ignoré(s) : ${errors[0]}`)
      }
      if (imported.length === 0 && errors.length === 0) {
        toast.error("Aucune recette trouvée dans ce fichier.")
      }
    } catch {
      toast.error("Fichier invalide ou illisible (JSON/CSV attendu).")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Sheet onOpenChange={handleSheetOpenChange}>
        <SheetTrigger render={<Button variant="outline" />}>
          <Download />
          Exporter
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Exporter mes recettes</SheetTitle>
            <SheetDescription>
              Les données sont exportées en clair (non chiffrées) : ne partagez le fichier qu'avec des personnes de
              confiance.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Recettes à exporter ({selectedIds.length}/{recipes.length})
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                {selectedIds.length === recipes.length ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
            </div>

            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {recipes.map((recipe) => (
                <label
                  key={recipe.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                  <Checkbox
                    checked={selectedIds.includes(recipe.id)}
                    onCheckedChange={() => toggleRecipe(recipe.id)}
                  />
                  {recipe.title}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("json")}>
              JSON
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("csv")}>
              CSV
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("mealie")}>
              Mealie (JSON)
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Button variant="outline" onClick={handleImportClick}>
        <Upload />
        Importer
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
