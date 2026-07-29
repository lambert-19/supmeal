import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { FormField } from "@/components/form-field"
import { useAuthStore } from "@/lib/stores/auth-store"
import { loginSchema } from "@/lib/schemas/auth"

function notifyOAuthComingSoon(provider) {
  toast.info(`La connexion via ${provider} arrivera bientôt.`)
}

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [authError, setAuthError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values) {
    setAuthError(null)
    try {
      await login(values)
      toast.success("Content de vous revoir !")
      navigate(location.state?.from?.pathname ?? "/recipes", { replace: true })
    } catch {
      setAuthError("Email ou mot de passe incorrect.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accédez à vos recettes et à vos cookbooks partagés.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="outline" type="button" onClick={() => notifyOAuthComingSoon("Google")}>
          Google
        </Button>
        <Button variant="outline" type="button" onClick={() => notifyOAuthComingSoon("GitHub")}>
          GitHub
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou avec votre email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="email" label="Adresse email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Mot de passe" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        {authError && (
          <p className="text-sm text-destructive" role="alert">
            {authError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Compte de démonstration : <span className="font-medium">demo@supmeal.fr</span> /{" "}
        <span className="font-medium">supmeal123</span>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
