import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../features/auth/AuthContext'
import { useThemeStore, ACCENT_HEX, type AccentColor } from '../../stores/themeStore'
import { Card } from '../../components/Card'
import styles from './Dashboard.module.css'

const NAV_ITEMS = [
  { label: 'Home', icon: '⌂', active: true },
  { label: 'All Documents', icon: '▤' },
  { label: 'Notebooks', icon: '▥' },
  { label: 'Sketches', icon: '✎' },
  { label: 'Favorites', icon: '★' },
  { label: 'Shared', icon: '⇄' },
  { label: 'Recent', icon: '◔' },
  { label: 'Trash', icon: '⌫' },
]

export function Dashboard() {
  const { user, logout } = useAuthContext()
  const { mode, accent, setMode, setAccent } = useThemeStore()
  const navigate = useNavigate()

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>N</div>
          <span className={styles.brandName}>Notey</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button key={item.label} className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}>
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className={styles.navItem} onClick={() => navigate('/settings')}>
          <span className={styles.navIcon}>⚙</span>
          Settings
        </button>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input placeholder="Search notebooks and sketches" />
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.themeToggle}>
              {(['light', 'dark', 'system'] as const).map((m) => (
                <button
                  key={m}
                  className={mode === m ? styles.themeActive : ''}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className={styles.accentRow}>
              {(Object.keys(ACCENT_HEX) as AccentColor[]).map((key) => (
                <button
                  key={key}
                  className={styles.accentDot}
                  style={{ background: ACCENT_HEX[key], outline: accent === key ? `2px solid ${ACCENT_HEX[key]}` : 'none', outlineOffset: 2 }}
                  onClick={() => setAccent(key)}
                  aria-label={`Accent ${key}`}
                />
              ))}
            </div>

            <button className={styles.avatar} onClick={handleSignOut} title="Sign out">
              {initials}
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.ctaRow}>
            <Card interactive className={styles.ctaCard} onClick={() => navigate('/notebooks/new')}>
              <div className={styles.ctaIcon} style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
                ▥
              </div>
              <div>
                <div className={styles.ctaTitle}>Create Notebook</div>
                <div className={styles.ctaSubtitle}>Pages, templates, handwritten notes</div>
              </div>
            </Card>

            <Card interactive className={styles.ctaCard} onClick={() => navigate('/sketches/new')}>
              <div className={styles.ctaIcon} style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
                ✎
              </div>
              <div>
                <div className={styles.ctaTitle}>New Sketch</div>
                <div className={styles.ctaSubtitle}>Free canvas for drawing and ideas</div>
              </div>
            </Card>
          </div>

          <section>
            <h2 className={styles.sectionTitle}>Recent Documents</h2>
            <Card className={styles.emptyState}>
              <p>No documents yet.</p>
              <p className={styles.emptyStateHint}>
                Create your first notebook or sketch above to see it here.
              </p>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}
