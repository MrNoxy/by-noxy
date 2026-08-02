import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../features/auth/AuthContext'
import { LoadingScreen } from '../components/LoadingScreen'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuthContext()

  if (initializing) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
