import { Navigate, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { AppLayout } from "@/layouts/app-layout"
import { AuthLayout } from "@/layouts/auth-layout"
import { ProtectedRoute } from "@/routes/protected-route"
import { PublicOnlyRoute } from "@/routes/public-only-route"
import { LoginPage } from "@/pages/auth/login-page"
import { RegisterPage } from "@/pages/auth/register-page"
import { RecipesPage } from "@/pages/recipes-page"
import { CookbooksPage } from "@/pages/cookbooks-page"
import { PlanningPage } from "@/pages/planning-page"
import { FavoritesPage } from "@/pages/favorites-page"
import { SettingsPage } from "@/pages/settings-page"
import { NotFoundPage } from "@/pages/not-found-page"

function App() {
  return (
    <>
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
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/cookbooks" element={<CookbooksPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App
