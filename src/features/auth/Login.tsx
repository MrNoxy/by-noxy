import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuthContext } from './AuthContext'
import { Button } from '../../components/Button'
import styles from './Auth.module.css'

export function Login() {
  const { login, loginWithGoogle } = useAuthContext()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: authError } = await login(email, password, remember)
    setSubmitting(false)
    if (authError) {
      setError(authError.message)
      return
    }
    navigate('/', { replace: true })
  }

  async function handleGoogle() {
    setError(null)
    setGoogleSubmitting(true)
    const { error: authError } = await loginWithGoogle()
    setGoogleSubmitting(false)
    if (authError) {
      setError(authError.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to keep working on your notebooks.">
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className={styles.row}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password" className={styles.link} style={{ textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="gradient" fullWidth loading={submitting}>
          Sign in
        </Button>

        <div className={styles.divider}>or</div>

        <Button type="button" variant="secondary" fullWidth loading={googleSubmitting} onClick={handleGoogle}>
          Continue with Google
        </Button>
      </form>

      <p className={styles.footer}>
        Don&rsquo;t have an account? <Link to="/register" className={styles.link} style={{ textDecoration: 'none' }}>Create one</Link>
      </p>
    </AuthLayout>
  )
}
