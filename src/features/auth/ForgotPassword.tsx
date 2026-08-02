import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuthContext } from './AuthContext'
import { Button } from '../../components/Button'
import styles from './Auth.module.css'

export function ForgotPassword() {
  const { resetPassword } = useAuthContext()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: resetError } = await resetPassword(email)
    setSubmitting(false)

    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We\u2019ll email you a link to choose a new one.">
      {sent ? (
        <div className={styles.success}>
          If an account exists for {email}, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <Button type="submit" variant="gradient" fullWidth loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}

      <p className={styles.footer}>
        <Link to="/login" className={styles.link} style={{ textDecoration: 'none' }}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
