import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../features/auth/AuthContext'
import { useThemeStore, ACCENT_HEX, type AccentColor } from '../stores/themeStore'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { label: 'Home', icon: '⌂', to: '/' },
  { label: 'All Documents', icon: '▤', to: '/documents' },
  { label: 'Notebooks', icon: '▥', to: '/notebooks' },
  { label: 'Sketches', icon: '✎', to: '/sketches' },
  { label: 'Favorites', icon: '★', to: '/favorites' },
  { label: 'Trash', icon: '⌫', to: '/trash' },
]

export interface AppShellContext {
  search: string
}

export function AppShell() {
  const { user, logout } = useAuthContext()
  const { mode, accent, setMode, setAccent } = useThemeStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

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
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
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
            <input
              placeholder="Search notebooks and sketches"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  style={{
                    background: ACCENT_HEX[key],
                    outline: accent === key ? `2px solid ${ACCENT_HEX[key]}` : 'none',
                    outlineOffset: 2,
                  }}
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
          <Outlet context={{ search } satisfies AppShellContext} />
        </main>
      </div>
    </div>
  )
}
