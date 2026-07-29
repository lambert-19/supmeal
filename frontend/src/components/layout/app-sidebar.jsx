import { ChefHat } from "lucide-react"

import { NavLinks } from "@/components/layout/nav-links"
import { UserMenu } from "@/components/layout/user-menu"

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <ChefHat className="size-5 text-primary" />
        <span className="font-heading text-base font-semibold">SUPMEAL</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        <NavLinks />
      </nav>
      <UserMenu />
    </aside>
  )
}
