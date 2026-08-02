import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from '../features/auth/Login'
import { Register } from '../features/auth/Register'
import { ForgotPassword } from '../features/auth/ForgotPassword'
import { VerifyEmail } from '../features/auth/VerifyEmail'
import { Library } from '../features/library/Library'
import { DocumentDetail } from '../features/library/DocumentDetail'
import { ComingSoon } from '../components/ComingSoon'
import { ProtectedRoute } from './ProtectedRoute'
import { AppShell } from './AppShell'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Library filter="home" />} />
        <Route path="/documents" element={<Library filter="all" />} />
        <Route path="/notebooks" element={<Library filter="notebooks" />} />
        <Route path="/sketches" element={<Library filter="sketches" />} />
        <Route path="/favorites" element={<Library filter="favorites" />} />
        <Route path="/trash" element={<Library filter="trash" />} />
        <Route path="/notebook/:id" element={<DocumentDetail />} />
        <Route path="/sketch/:id" element={<DocumentDetail />} />
        <Route path="/settings" element={<ComingSoon title="Settings" phase="Phase 5 — Settings & Polish" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
