import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/nav-items"

export function NavLinks({ onNavigate }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
            )
          }>
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </>
  )
}
