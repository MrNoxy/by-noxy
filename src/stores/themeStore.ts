import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
export type AccentColor =
  | 'blue'
  | 'purple'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'teal'

export const ACCENT_HEX: Record<AccentColor, string> = {
  blue: '#3B82F6',
  purple: '#A855F7',
  green: '#22C55E',
  orange: '#F97316',
  red: '#EF4444',
  pink: '#EC4899',
  teal: '#14B8A6',
}

interface ThemeState {
  mode: ThemeMode
  accent: AccentColor
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
}

const STORAGE_KEY = 'notey.theme'

function loadPersisted(): { mode: ThemeMode; accent: AccentColor } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { mode: 'system', accent: 'blue' }
    const parsed = JSON.parse(raw)
    return {
      mode: parsed.mode ?? 'system',
      accent: parsed.accent ?? 'blue',
    }
  } catch {
    return { mode: 'system', accent: 'blue' }
  }
}

function persist(mode: ThemeMode, accent: AccentColor) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent }))
  } catch {
    // localStorage can throw in private-browsing / storage-full edge cases.
    // Theme preference simply won't persist across reloads in that case.
  }
}

/** Applies the resolved theme + accent to the document root as data attributes
 *  so CSS custom properties in theme.css can react without any JS re-render. */
function applyToDocument(mode: ThemeMode, accent: AccentColor) {
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode

  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.setAttribute('data-accent', accent)
  root.style.setProperty('--accent', ACCENT_HEX[accent])
}

const initial = loadPersisted()
applyToDocument(initial.mode, initial.accent)

// Keep the resolved theme in sync if the OS-level preference changes while
// the user has "system" selected.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { mode, accent } = useThemeStore.getState()
  if (mode === 'system') applyToDocument(mode, accent)
})

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initial.mode,
  accent: initial.accent,
  setMode: (mode) => {
    set({ mode })
    applyToDocument(mode, get().accent)
    persist(mode, get().accent)
  },
  setAccent: (accent) => {
    set({ accent })
    applyToDocument(get().mode, accent)
    persist(get().mode, accent)
  },
}))
