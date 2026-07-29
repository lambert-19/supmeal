import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/stores/auth-store"
import { OAUTH_PROVIDERS } from "@/lib/constants/preferences"

export function ConnectionsTab() {
  const user = useAuthStore((s) => s.user)
  const toggleOAuthConnection = useAuthStore((s) => s.toggleOAuthConnection)

  function handleToggle(provider, label) {
    toggleOAuthConnection(provider)
    const nowConnected = !user.connections[provider]
    toast.success(nowConnected ? `Compte ${label} lié.` : `Compte ${label} dissocié.`)
  }

  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm text-muted-foreground">
        Le flux OAuth2 réel n'est pas encore branché côté serveur : ces bascules simulent
        localement l'association d'un compte tiers.
      </p>
      {OAUTH_PROVIDERS.map(({ key, label, description }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor={`oauth-${key}`}>{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch
            id={`oauth-${key}`}
            checked={user.connections[key]}
            onCheckedChange={() => handleToggle(key, label)}
          />
        </div>
      ))}
    </div>
  )
}
