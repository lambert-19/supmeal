import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"

export function AppLayout() {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto w-full max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
