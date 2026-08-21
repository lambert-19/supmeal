import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"

const TILT_RANGE = 10

export function TiltCard({ children, className, glare = false }) {
  const prefersReducedMotion = useReducedMotion()

  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [TILT_RANGE, -TILT_RANGE]), {
    stiffness: 300,
    damping: 25,
  })
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-TILT_RANGE, TILT_RANGE]), {
    stiffness: 300,
    damping: 25,
  })
  const glareBackground = useTransform(
    [pointerX, pointerY],
    ([x, y]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, color-mix(in oklch, white, transparent 60%), transparent 60%)`
  )

  function handlePointerMove(event) {
    if (prefersReducedMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width)
    pointerY.set((event.clientY - bounds.top) / bounds.height)
  }

  function handlePointerLeave() {
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={prefersReducedMotion ? undefined : { rotateX, rotateY, transformPerspective: 800 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      className={cn("group/tilt-card relative", className)}>
      {children}
      {glare && !prefersReducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/tilt-card:opacity-100"
          style={{ background: glareBackground }}
        />
      )}
    </motion.div>
  )
}
