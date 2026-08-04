import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: true,
})

const CSRF_COOKIE_NAME = "supmeal_csrf"
const SAFE_METHODS = new Set(["get", "head", "options"])

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Pattern double-submit cookie (voir backend/middleware/csrf.js) : ce cookie
// n'est pas httpOnly, on le recopie donc en en-tête sur toute requête mutante
// pour prouver qu'on n'est pas une requête cross-site forgée.
api.interceptors.request.use((config) => {
  if (!SAFE_METHODS.has((config.method ?? "get").toLowerCase())) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME)
    if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken
  }
  return config
})

// Une session expirée/révoquée renvoie 401 sur n'importe quelle route protégée.
// On le signale via un event plutôt que d'importer auth-store ici (éviterait un
// import circulaire) — auth-store écoute cet event pour vider `user`, ce qui fait
// naturellement rediriger vers /login via ProtectedRoute. Les endpoints /auth/*
// eux-mêmes sont exclus (un 401 sur /auth/login est juste "mauvais identifiants").
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
      window.dispatchEvent(new Event("supmeal:unauthorized"))
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback
}
