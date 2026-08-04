import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { ChefHat, CookingPot, Soup, Sparkles, UtensilsCrossed } from "lucide-react"

const FLOATING_ICONS = [
  { Icon: UtensilsCrossed, className: "top-[18%] left-[62%] size-8", depth: 30, duration: 7 },
  { Icon: Soup, className: "top-[68%] left-[12%] size-10", depth: 45, duration: 9 },
  { Icon: CookingPot, className: "top-[42%] left-[80%] size-7", depth: 20, duration: 8 },
  { Icon: Sparkles, className: "top-[28%] left-[28%] size-5", depth: 15, duration: 6 },
]

function FloatingIcon({ Icon, className, depth, duration, pointerX, pointerY, prefersReducedMotion }) {
  const x = useTransform(pointerX, [0, 1], [-depth, depth])
  const y = useTransform(pointerY, [0, 1], [-depth, depth])
  const springX = useSpring(x, { stiffness: 120, damping: 20 })
  const springY = useSpring(y, { stiffness: 120, damping: 20 })

  return (
    <motion.div
      className={`pointer-events-none absolute text-primary-foreground/25 ${className}`}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
      transition={prefersReducedMotion ? undefined : { duration, repeat: Infinity, ease: "easeInOut" }}>
      <Icon className="size-full" strokeWidth={1.5} />
    </motion.div>
  )
}

export function AuthLayout({ children }) {
  const prefersReducedMotion = useReducedMotion()
  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)

  const blobX = useSpring(useTransform(pointerX, [0, 1], [-20, 20]), { stiffness: 80, damping: 20 })
  const blobY = useSpring(useTransform(pointerY, [0, 1], [-20, 20]), { stiffness: 80, damping: 20 })

  function handlePointerMove(event) {
    if (prefersReducedMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width)
    pointerY.set((event.clientY - bounds.top) / bounds.height)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div
        onPointerMove={handlePointerMove}
        className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-primary p-10 text-primary-foreground perspective-[1000px] lg:flex">
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={prefersReducedMotion ? undefined : { x: blobX, y: blobY }}>
          <div className="absolute -top-20 -left-20 size-80 animate-[drift-1_18s_ease-in-out_infinite] rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute top-1/3 -right-24 size-96 animate-[drift-2_22s_ease-in-out_infinite] rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 size-72 animate-[drift-3_26s_ease-in-out_infinite] rounded-full bg-primary-foreground/8 blur-3xl" />
        </motion.div>

        {FLOATING_ICONS.map((icon, index) => (
          <FloatingIcon key={index} {...icon} pointerX={pointerX} pointerY={pointerY} prefersReducedMotion={prefersReducedMotion} />
        ))}

        <motion.div
          className="relative flex items-center gap-2 font-heading text-lg font-semibold"
          animate={prefersReducedMotion ? undefined : { rotate: [0, -4, 4, 0] }}
          transition={prefersReducedMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <ChefHat className="size-6" />
          SUPMEAL
        </motion.div>
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
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-sm">
          {children}
        </motion.div>
      </div>
    </div>
  )
}
