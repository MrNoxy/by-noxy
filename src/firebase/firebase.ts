/**
 * Firebase singleton initialization.
 *
 * This module must be the ONLY place `initializeApp` is called. Every other
 * part of the app imports `auth`, `database`, and `storage` from here rather
 * than touching the Firebase SDK directly. That keeps configuration in one
 * place and makes it trivial to mock Firebase in tests later.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

function readFirebaseConfig() {
  const env = import.meta.env
  const missing = requiredEnvVars.filter((key) => !env[key])

  if (missing.length > 0) {
    // Thrown at startup rather than failing silently later inside a random
    // Firebase call — this is the single place a misconfigured .env.local
    // will surface, with a message that tells you exactly what to fix.
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and fill in your Firebase project config.',
    )
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}

// Vite HMR can re-evaluate this module during development; guard against
// calling initializeApp() twice, which Firebase throws on.
const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(readFirebaseConfig())

export const auth: Auth = getAuth(app)
export const database: Database = getDatabase(app)
export const storage: FirebaseStorage = getStorage(app)
export default app
