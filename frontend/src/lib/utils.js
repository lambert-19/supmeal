import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatTimestamp(timestamp) {
  return TIMESTAMP_FORMAT.format(new Date(timestamp))
}

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" })
const RELATIVE_TIME_UNITS = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

// "Vu pour la dernière fois" — bascule sur la date absolue au-delà d'une
// semaine plutôt que d'afficher "il y a 3 semaines", peu lisible en français.
export function formatLastSeen(timestamp) {
  if (!timestamp) return null
  const diffSeconds = Math.round((new Date(timestamp).getTime() - Date.now()) / 1000)
  if (diffSeconds > -60) return "à l'instant"

  for (const [unit, secondsInUnit] of RELATIVE_TIME_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === "minute") {
      if (unit === "day" && Math.abs(diffSeconds) > 7 * secondsInUnit) break
      return RELATIVE_TIME_FORMAT.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return formatTimestamp(timestamp)
}
