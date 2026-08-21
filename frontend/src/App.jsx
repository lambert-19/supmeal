import { lazy, Suspense, useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { PageLoader } from "@/components/page-loader"
import { AppLayout } from "@/layouts/app-layout"
import { AuthLayout } from "@/layouts/auth-layout"
import { ProtectedRoute } from "@/routes/protected-route"
import { PublicOnlyRoute } from "@/routes/public-only-route"
import { useAuthStore } from "@/lib/stores/auth-store"

const LoginPage = lazy(() => import("@/pages/auth/login-page").then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/pages/auth/register-page").then((m) => ({ default: m.RegisterPage })))
const VerifyEmailPage = lazy(() =>
  import("@/pages/auth/verify-email-page").then((m) => ({ default: m.VerifyEmailPage }))
)
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/reset-password-page").then((m) => ({ default: m.ResetPasswordPage }))
)
const RecipesPage = lazy(() => import("@/pages/recipes-page").then((m) => ({ default: m.RecipesPage })))
const NewRecipePage = lazy(() =>
  import("@/pages/recipes/new-recipe-page").then((m) => ({ default: m.NewRecipePage }))
)
const EditRecipePage = lazy(() =>
  import("@/pages/recipes/edit-recipe-page").then((m) => ({ default: m.EditRecipePage }))
)
const RecipeDetailPage = lazy(() =>
  import("@/pages/recipes/recipe-detail-page").then((m) => ({ default: m.RecipeDetailPage }))
)
const CookbooksPage = lazy(() => import("@/pages/cookbooks-page").then((m) => ({ default: m.CookbooksPage })))
const NewCookbookPage = lazy(() =>
  import("@/pages/cookbooks/new-cookbook-page").then((m) => ({ default: m.NewCookbookPage }))
)
const EditCookbookPage = lazy(() =>
  import("@/pages/cookbooks/edit-cookbook-page").then((m) => ({ default: m.EditCookbookPage }))
)
const CookbookDetailPage = lazy(() =>
  import("@/pages/cookbooks/cookbook-detail-page").then((m) => ({ default: m.CookbookDetailPage }))
)
const PlanningPage = lazy(() => import("@/pages/planning-page").then((m) => ({ default: m.PlanningPage })))
const FavoritesPage = lazy(() => import("@/pages/favorites-page").then((m) => ({ default: m.FavoritesPage })))
const SuggestionsPage = lazy(() =>
  import("@/pages/suggestions-page").then((m) => ({ default: m.SuggestionsPage }))
)
const SettingsPage = lazy(() => import("@/pages/settings-page").then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then((m) => ({ default: m.NotFoundPage })))

function App() {
  const status = useAuthStore((s) => s.status)
  const bootstrap = useAuthStore((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  if (status !== "ready") {
    return <PageLoader />
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <AuthLayout>
                  <RegisterPage />
                </AuthLayout>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <AuthLayout>
                <VerifyEmailPage />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<NewRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
            <Route path="/cookbooks" element={<CookbooksPage />} />
            <Route path="/cookbooks/new" element={<NewCookbookPage />} />
            <Route path="/cookbooks/:id" element={<CookbookDetailPage />} />
            <Route path="/cookbooks/:id/edit" element={<EditCookbookPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}

export default App
