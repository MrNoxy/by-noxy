import { useCallback, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from 'firebase/auth'
import { auth } from '../../firebase/firebase'

export interface AuthError {
  code: string
  message: string
}

/** Turns Firebase's raw error codes into copy a student would actually understand. */
function friendlyAuthError(error: unknown): AuthError {
  const code = (error as { code?: string })?.code ?? 'auth/unknown'
  const messages: Record<string, string> = {
    'auth/invalid-email': 'That email address doesn\u2019t look right.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'That email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Trying another way\u2026',
    'auth/popup-closed-by-user': 'Sign-in was closed before finishing.',
    'auth/unauthorized-domain':
      'This domain isn\u2019t authorized for Google Sign-In yet. Add it in the Firebase console under Authentication \u2192 Settings \u2192 Authorized domains.',
    'auth/operation-not-allowed':
      'Google Sign-In isn\u2019t enabled for this project yet. Enable it in the Firebase console under Authentication \u2192 Sign-in method.',
  }
  return { code, message: messages[code] ?? 'Something went wrong. Please try again.' }
}

/** Central auth hook. Every screen that needs auth state or actions uses this
 *  instead of touching the Firebase SDK directly, so behavior stays consistent. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setInitializing(false)
    })
    return unsubscribe
  }, [])

  // Handle the return leg of a redirect-based Google sign-in (used when the
  // popup is blocked, which is common in embedded/iPad Safari contexts).
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error('Google redirect sign-in failed:', friendlyAuthError(error))
    })
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(credential.user, { displayName })
      }
      await sendEmailVerification(credential.user)
      return { user: credential.user, error: null }
    } catch (error) {
      return { user: null, error: friendlyAuthError(error) }
    }
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean = true) => {
    try {
      // "Remember me" maps to a real Firebase Auth persistence mode:
      // local persistence survives browser restarts, session persistence
      // clears when the tab/browser closes. This must be set *before*
      // signing in — it governs how the resulting session is stored.
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return { user: credential.user, error: null }
    } catch (error) {
      return { user: null, error: friendlyAuthError(error) }
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    try {
      const credential = await signInWithPopup(auth, provider)
      return { user: credential.user, error: null }
    } catch (error) {
      const friendly = friendlyAuthError(error)
      // Popups are frequently blocked on iPad Safari / PWA standalone mode.
      // Fall back to a full-page redirect rather than leaving the user stuck.
      if (friendly.code === 'auth/popup-blocked' || friendly.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider)
        return { user: null, error: null }
      }
      return { user: null, error: friendly }
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { error: null }
    } catch (error) {
      return { error: friendlyAuthError(error) }
    }
  }, [])

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) return { error: { code: 'auth/no-user', message: 'No signed-in user.' } }
    try {
      await sendEmailVerification(auth.currentUser)
      return { error: null }
    } catch (error) {
      return { error: friendlyAuthError(error) }
    }
  }, [])

  return {
    user,
    initializing,
    isEmailVerified: user?.emailVerified ?? false,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerification,
  }
}
