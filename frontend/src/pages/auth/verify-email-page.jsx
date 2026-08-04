import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/form-field"
import { MotionPress } from "@/components/motion-press"
import { api, apiErrorMessage } from "@/lib/api"
import { emailOnlySchema } from "@/lib/schemas/auth"
import { FORM_STAGGER_CONTAINER_VARIANTS, FORM_STAGGER_ITEM_VARIANTS } from "@/lib/motion-variants"

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [status, setStatus] = useState(token ? "verifying" : "missing")
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .post("/auth/verify-email", { token })
      .then(() => {
        if (!cancelled) setStatus("success")
      })
      .catch((error) => {
        if (cancelled) return
        setErrorMessage(apiErrorMessage(error, "Lien invalide ou expiré."))
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  })

  async function onResend(values) {
    try {
      await api.post("/auth/resend-verification", values)
      toast.success("Si un compte non vérifié existe avec cet email, un lien a été envoyé.")
    } catch {
      toast.error("Une erreur est survenue, réessayez plus tard.")
    }
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : FORM_STAGGER_CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      className="space-y-6">
      <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS} className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Vérification de l'email</h1>
        {status === "verifying" && (
          <p className="text-sm text-muted-foreground">Vérification de votre lien en cours...</p>
        )}
        {status === "success" && (
          <p className="text-sm text-muted-foreground">
            Votre adresse email est vérifiée. Vous pouvez maintenant vous connecter.
          </p>
        )}
        {status === "missing" && (
          <p className="text-sm text-destructive" role="alert">
            Ce lien de vérification est invalide.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </motion.div>

      {status === "success" && (
        <motion.div variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}>
          <MotionPress className="w-full">
            <Button type="button" className="w-full" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
          </MotionPress>
        </motion.div>
      )}

      {(status === "missing" || status === "error") && (
        <motion.form
          variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
          onSubmit={handleSubmit(onResend)}
          className="space-y-4"
          noValidate>
          <p className="text-sm text-muted-foreground">Demandez un nouveau lien de vérification :</p>
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
          <MotionPress className="w-full">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Renvoyer un email de vérification"}
            </Button>
          </MotionPress>
        </motion.form>
      )}

      <motion.p
        variants={prefersReducedMotion ? undefined : FORM_STAGGER_ITEM_VARIANTS}
        className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </motion.p>
    </motion.div>
  )
}
