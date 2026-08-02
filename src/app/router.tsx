import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from '../features/auth/Login'
import { Register } from '../features/auth/Register'
import { ForgotPassword } from '../features/auth/ForgotPassword'
import { VerifyEmail } from '../features/auth/VerifyEmail'
import { Dashboard } from '../features/dashboard/Dashboard'
import { ComingSoon } from '../components/ComingSoon'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notebooks/new"
        element={
          <ProtectedRoute>
            <ComingSoon title="Create Notebook" phase="Phase 2 — Notebook System" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sketches/new"
        element={
          <ProtectedRoute>
            <ComingSoon title="New Sketch" phase="Phase 2 — Sketch System" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ComingSoon title="Settings" phase="Phase 5 — Settings & Polish" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
