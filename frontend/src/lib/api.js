import axios from "axios"

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const SAFE_METHODS = new Set(["get", "head", "options"])

// Pattern double-submit cookie (voir backend/middleware/csrf.js) : le serveur
// pose aussi ce jeton en cookie, mais un cookie posé par le backend (ex.
// onrender.com) n'est pas lisible en JS depuis une origine différente (ex.
// vercel.app) — on le récupère donc via cet en-tête de réponse à la place
// (renvoyé par /auth/login et /auth/me), et on le recopie en en-tête sur
// toute requête mutante pour prouver qu'on n'est pas une requête cross-site
// forgée.
let csrfToken = null

api.interceptors.request.use((config) => {
  if (!SAFE_METHODS.has((config.method ?? "get").toLowerCase()) && csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken
  }
  return config
})

// Une session expirée/révoquée renvoie 401 sur n'importe quelle route protégée.
// On le signale via un event plutôt que d'importer auth-store ici (éviterait un
// import circulaire) — auth-store écoute cet event pour vider `user`, ce qui fait
// naturellement rediriger vers /login via ProtectedRoute. Les endpoints /auth/*
// eux-mêmes sont exclus (un 401 sur /auth/login est juste "mauvais identifiants").
api.interceptors.response.use(
  (response) => {
    const token = response.headers["x-csrf-token"]
    if (token) csrfToken = token
    return response
  },
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

// Navigation plein-page (pas un appel axios) : ces routes redirigent vers
// l'écran de consentement du fournisseur puis reviennent poser le cookie de
// session côté serveur, un <a href> classique est donc nécessaire ici.
export function oauthStartUrl(provider, intent = "login") {
  return `${API_BASE_URL}/auth/oauth/${provider}${intent === "link" ? "/link" : ""}`
}
