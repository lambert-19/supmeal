import { Check, Circle } from "lucide-react"

import { PASSWORD_REQUIREMENTS, getPasswordStrength } from "@/lib/password-strength"
import { cn } from "@/lib/utils"

const STRENGTH_STYLES = {
  weak: { bars: 1, barColor: "bg-destructive", textColor: "text-destructive" },
  medium: { bars: 2, barColor: "bg-amber-500", textColor: "text-amber-500" },
  strong: { bars: 3, barColor: "bg-green-500", textColor: "text-green-600 dark:text-green-500" },
}

export function PasswordStrengthMeter({ value }) {
  const safeValue = value ?? ""
  const strength = getPasswordStrength(safeValue)
  const styles = STRENGTH_STYLES[strength.level]

  return (
    <div className="space-y-2">
      {styles && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn("h-1 flex-1 rounded-full bg-muted transition-colors", index < styles.bars && styles.barColor)}
              />
            ))}
          </div>
          <p className={cn("text-xs font-medium", styles.textColor)}>Mot de passe {strength.label.toLowerCase()}</p>
        </div>
      )}
      <ul className="space-y-1">
        {PASSWORD_REQUIREMENTS.map((rule) => {
          const met = rule.test(safeValue)
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                met ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
              )}>
              {met ? <Check className="size-3.5 shrink-0" /> : <Circle className="size-3.5 shrink-0" />}
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
