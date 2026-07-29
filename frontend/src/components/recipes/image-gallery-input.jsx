import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_IMAGES, MAX_IMAGE_SIZE_BYTES } from "@/lib/constants/recipe"

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImageGalleryInput({ value, onChange, className }) {
  const remainingSlots = MAX_IMAGES - value.length

  const onDrop = useCallback(
    async (files) => {
      const accepted = files.slice(0, remainingSlots)
      if (files.length > accepted.length) {
        toast.error(`Seules les ${accepted.length} premières images ont été ajoutées (${MAX_IMAGES} maximum).`)
      }
      const validFiles = accepted.filter((file) => {
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(`« ${file.name} » est trop lourde (2 Mo maximum).`)
          return false
        }
        return true
      })
      if (validFiles.length === 0) return
      const dataUrls = await Promise.all(validFiles.map(readFileAsDataUrl))
      onChange([...value, ...dataUrls])
    },
    [remainingSlots, value, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  })

  function removeImage(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((src, index) => (
          <div
            key={index}
            className="relative aspect-4/3 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <img src={src} alt={`Aperçu ${index + 1}`} className="size-full object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-1 right-1"
              onClick={() => removeImage(index)}
              aria-label={`Retirer l'image ${index + 1}`}>
              <X className="size-3.5" />
            </Button>
          </div>
        ))}

        {remainingSlots > 0 && (
          <div
            {...getRootProps()}
            className={cn(
              "flex aspect-4/3 w-32 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-center transition-colors hover:bg-muted/50",
              isDragActive && "border-primary bg-primary/5"
            )}>
            <input {...getInputProps()} />
            <ImagePlus className="size-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Ajouter</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_IMAGES} images · 2 Mo maximum par image
      </p>
    </div>
  )
}
