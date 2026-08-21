import { UtensilsCrossed, Users, CalendarDays, Heart, Sparkles } from "lucide-react"

export const NAV_ITEMS = [
  { to: "/recipes", label: "Mes recettes", icon: UtensilsCrossed },
  { to: "/cookbooks", label: "Cookbooks", icon: Users },
  { to: "/planning", label: "Planning des repas", icon: CalendarDays },
  { to: "/favorites", label: "Favoris", icon: Heart },
  { to: "/suggestions", label: "Suggestions", icon: Sparkles },
]
