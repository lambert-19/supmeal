import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FormField({ id, label, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
