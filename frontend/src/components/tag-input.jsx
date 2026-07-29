import { useState } from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

export function TagInput({ value, onChange, suggestions = [], placeholder, className }) {
  const [draft, setDraft] = useState("")

  function addTag(rawTag) {
    const tag = rawTag.trim()
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setDraft("")
  }

  function removeTag(tag) {
    onChange(value.filter((existing) => existing !== tag))
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTag(draft)
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full text-secondary-foreground/70 hover:text-secondary-foreground"
              aria-label={`Retirer le tag ${tag}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="h-6 min-w-32 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          list="tag-suggestions"
        />
      </div>
      {suggestions.length > 0 && (
        <datalist id="tag-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
    </div>
  )
}
