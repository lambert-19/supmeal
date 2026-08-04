import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

export function MotionPress({ children, className }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={cn("inline-block", className)}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}>
      {children}
    </motion.div>
  )
}
