import { useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { ChefHat, Menu, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavLinks } from "@/components/layout/nav-links"
import { UserMenu } from "@/components/layout/user-menu"

export function AppTopbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isRecipesPage = location.pathname === "/recipes"
  const [searchParams, setSearchParams] = useSearchParams()
  const [draftQuery, setDraftQuery] = useState("")
  const [wasOnRecipesPage, setWasOnRecipesPage] = useState(isRecipesPage)

  if (isRecipesPage !== wasOnRecipesPage) {
    setWasOnRecipesPage(isRecipesPage)
    if (!isRecipesPage) setDraftQuery("")
  }

  const query = isRecipesPage ? (searchParams.get("q") ?? "") : draftQuery

  function handleQueryChange(value) {
    if (isRecipesPage) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set("q", value)
          else next.delete("q")
          return next
        },
        { replace: true }
      )
    } else {
      setDraftQuery(value)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!isRecipesPage && query.trim()) {
      navigate(`/recipes?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 lg:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
          <Menu />
          <span className="sr-only">Ouvrir le menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <div className="flex h-14 items-center gap-2 px-4">
            <ChefHat className="size-5 text-primary" />
            <span className="font-heading text-base font-semibold">SUPMEAL</span>
          </div>
          <nav className="flex-1 space-y-0.5 px-3 py-2">
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </nav>
          <UserMenu />
        </SheetContent>
      </Sheet>

      <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Rechercher une recette, un ingrédient..."
          className="pl-8"
          aria-label="Rechercher une recette"
        />
      </form>

      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
