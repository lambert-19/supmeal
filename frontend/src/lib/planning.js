export const MEAL_SLOTS = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "lunch", label: "Déjeuner" },
  { value: "dinner", label: "Dîner" },
]

export const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const DAY_MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" })
const DAY_MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })

export function formatWeekLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6)
  return `Semaine du ${DAY_MONTH_FORMAT.format(weekStart)} au ${DAY_MONTH_YEAR_FORMAT.format(weekEnd)}`
}

export function parseQuantity(raw) {
  if (!raw) return null
  const trimmed = raw.trim().replace(",", ".")
  if (trimmed.includes("/")) {
    const [num, den] = trimmed.split("/").map(Number)
    return Number.isFinite(num) && Number.isFinite(den) && den !== 0 ? num / den : null
  }
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function formatQuantity(value) {
  return String(Math.round(value * 100) / 100)
}
