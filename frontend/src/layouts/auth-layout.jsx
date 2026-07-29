import { ChefHat } from "lucide-react"

export function AuthLayout({ children }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, color-mix(in oklch, var(--primary-foreground), transparent 75%) 0%, transparent 45%), radial-gradient(circle at 85% 85%, color-mix(in oklch, var(--primary-foreground), transparent 82%) 0%, transparent 50%)",
          }}
        />
        <div className="relative flex items-center gap-2 font-heading text-lg font-semibold">
          <ChefHat className="size-6" />
          SUPMEAL
        </div>
        <div className="relative max-w-md space-y-3">
          <h1 className="font-heading text-3xl leading-tight font-semibold">
            Organisez, partagez et planifiez vos recettes.
          </h1>
          <p className="text-primary-foreground/85">
            Créez des cookbooks avec vos proches ou vos collègues, planifiez vos repas de la
            semaine et gardez toutes vos recettes préférées au même endroit.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} SUPMEAL Pro
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
