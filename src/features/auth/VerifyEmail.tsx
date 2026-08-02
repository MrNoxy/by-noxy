import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuthContext } from './AuthContext'
import { Button } from '../../components/Button'
import styles from './Auth.module.css'

export function VerifyEmail() {
  const { user, isEmailVerified, resendVerification, logout } = useAuthContext()
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleResend() {
    setSubmitting(true)
    await resendVerification()
    setSubmitting(false)
    setSent(true)
  }

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  if (isEmailVerified) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <AuthLayout title="Verify your email" subtitle={`We sent a verification link to ${user?.email ?? 'your email'}.`}>
      {sent && <div className={styles.success} style={{ marginBottom: 16 }}>Verification email sent.</div>}
      <Button variant="gradient" fullWidth loading={submitting} onClick={handleResend}>
        Resend verification email
      </Button>
      <p className={styles.footer}>
        Already verified? Reload the page.{' '}
        <button className={styles.link} onClick={handleSignOut} type="button">
          Sign out
        </button>
      </p>
    </AuthLayout>
  )
}
