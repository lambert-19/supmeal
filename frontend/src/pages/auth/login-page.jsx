import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import { Separator } from "@/components/ui/separator"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { GoogleIcon } from "@/components/icons/google-icon"
import { GithubIcon } from "@/components/icons/github-icon"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiErrorMessage } from "@/lib/api"
import { loginSchema } from "@/lib/schemas/auth"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

function notifyOAuthComingSoon(provider) {
  toast.info(`La connexion via ${provider} arrivera bientôt.`)
}

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [authError, setAuthError] = useState(null)
  const prefersReducedMotion = useReducedMotion()

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
    } catch (error) {
      setAuthError(apiErrorMessage(error, "Email ou mot de passe incorrect."))
    }
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      className="space-y-6">
      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accédez à vos recettes et à vos cookbooks partagés.
        </p>
      </motion.div>

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="grid grid-cols-2 gap-2.5">
        <MotionPress>
          <Button variant="outline" type="button" className="w-full" onClick={() => notifyOAuthComingSoon("Google")}>
            <GoogleIcon />
            Google
          </Button>
        </MotionPress>
        <MotionPress>
          <Button variant="outline" type="button" className="w-full" onClick={() => notifyOAuthComingSoon("GitHub")}>
            <GithubIcon className="size-4" />
            GitHub
          </Button>
        </MotionPress>
      </motion.div>

      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou avec votre email</span>
        <Separator className="flex-1" />
      </motion.div>

      <motion.form
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate>
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
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <p className="text-right text-xs">
          <Link to="/reset-password" className="font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>

        {authError && (
          <p className="text-sm text-destructive" role="alert">
            {authError}
          </p>
        )}

        <MotionPress className="w-full">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </MotionPress>
      </motion.form>

      <motion.p
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </motion.p>
    </motion.div>
  )
}
