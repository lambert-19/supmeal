import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/stores/auth-store"
import { oauthStartUrl, apiErrorMessage } from "@/lib/api"
import { OAUTH_PROVIDERS } from "@/lib/constants/preferences"

const OAUTH_ERROR_MESSAGES = {
  not_configured: "Cette connexion n'est pas encore configurée côté serveur.",
  access_denied: "Connexion annulée.",
  email_unavailable: "Ce fournisseur n'a communiqué aucune adresse email vérifiée.",
  state_mismatch: "La session de liaison a expiré, merci de réessayer.",
  unknown_provider: "Fournisseur inconnu.",
  already_linked: "Ce compte tiers est déjà lié à un autre utilisateur SUPMEAL.",
  oauth_failed: "La liaison a échoué, merci de réessayer.",
}

export function ConnectionsTab() {
  const user = useAuthStore((s) => s.user)
  const disconnectOAuthProvider = useAuthStore((s) => s.disconnectOAuthProvider)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const linked = searchParams.get("linked")
    const oauthError = searchParams.get("oauthError")
    if (linked) {
      const label = OAUTH_PROVIDERS.find((p) => p.key === linked)?.label ?? linked
      toast.success(`Compte ${label} lié.`)
    } else if (oauthError) {
      toast.error(OAUTH_ERROR_MESSAGES[oauthError] ?? OAUTH_ERROR_MESSAGES.oauth_failed)
    }
    if (linked || oauthError) {
      setSearchParams(
        (current) => {
          current.delete("linked")
          current.delete("oauthError")
          return current
        },
        { replace: true }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne doit tourner qu'au montage (lecture des query params de retour OAuth2), pas à chaque changement de searchParams qu'on vient nous-mêmes de nettoyer.
  }, [])

  async function handleDisconnect(provider, label) {
    try {
      await disconnectOAuthProvider(provider)
      toast.success(`Compte ${label} dissocié.`)
    } catch (error) {
      toast.error(apiErrorMessage(error, `Impossible de délier ${label}.`))
    }
  }

  const linkedCount = OAUTH_PROVIDERS.filter((p) => user.connections[p.key]).length
  const canDisconnectAny = user.hasPassword || linkedCount > 1

  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm text-muted-foreground">
        Liez un compte tiers pour vous y connecter directement, sans mot de passe.
      </p>
      {OAUTH_PROVIDERS.map(({ key, label, description }) => {
        const connected = user.connections[key]
        const disableDisconnect = connected && !canDisconnectAny
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor={`oauth-${key}`}>{label}</Label>
              <p className="text-xs text-muted-foreground">{description}</p>
              {disableDisconnect && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Définissez un mot de passe avant de pouvoir délier ce compte (c'est votre seul moyen de connexion).
                </p>
              )}
            </div>
            {connected ? (
              <Button
                id={`oauth-${key}`}
                type="button"
                variant="outline"
                size="sm"
                disabled={disableDisconnect}
                onClick={() => handleDisconnect(key, label)}>
                Délier
              </Button>
            ) : (
              <Button id={`oauth-${key}`} size="sm" render={<a href={oauthStartUrl(key, "link")} />} nativeButton={false}>
                Lier
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
