/**
 * A small, direct wrapper around the native IndexedDB API — no external
 * dependency, since all we need is two object stores:
 *
 *   canvasCache  — keyed by docId, holds the last-known canvas content
 *                  (layers + activeLayerId + a local updatedAt timestamp).
 *                  This is what makes the editor work fully offline and
 *                  survive a refresh/crash: it's read before any network
 *                  call is made.
 *
 *   syncQueue    — keyed by docId, holds documents with local changes that
 *                  haven't been confirmed written to Firebase yet. This
 *                  persists across tab closes, so if you draw something,
 *                  lose connectivity, and close the tab, reopening it will
 *                  still retry the upload rather than silently dropping it.
 */

const DB_NAME = 'notey-offline'
const DB_VERSION = 1
const CANVAS_STORE = 'canvasCache'
const QUEUE_STORE = 'syncQueue'

export function cacheKey(uid: string, docId: string): string {
  return `${uid}_${docId}`
}

export interface CachedCanvasPayload {
  key: string
  uid: string
  docId: string
  layers: unknown
  activeLayerId: string
  updatedAt: number
}

export interface SyncQueueEntry {
  key: string
  uid: string
  docId: string
  payload: CachedCanvasPayload
  attempts: number
  lastAttemptAt: number | null
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(CANVAS_STORE)) {
        db.createObjectStore(CANVAS_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
  return db.transaction(store, mode).objectStore(store)
}

export async function saveCanvasCache(payload: CachedCanvasPayload): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, CANVAS_STORE, 'readwrite').put(payload)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function loadCanvasCache(uid: string, docId: string): Promise<CachedCanvasPayload | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, CANVAS_STORE, 'readonly').get(cacheKey(uid, docId))
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function enqueueSync(payload: CachedCanvasPayload): Promise<void> {
  const db = await openDb()
  const existing = await new Promise<SyncQueueEntry | undefined>((resolve, reject) => {
    const request = tx(db, QUEUE_STORE, 'readonly').get(payload.key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const entry: SyncQueueEntry = {
    key: payload.key,
    uid: payload.uid,
    docId: payload.docId,
    payload,
    attempts: existing?.attempts ?? 0,
    lastAttemptAt: null,
  }
  return new Promise((resolve, reject) => {
    const request = tx(db, QUEUE_STORE, 'readwrite').put(entry)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function dequeueSync(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, QUEUE_STORE, 'readwrite').delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function recordSyncAttempt(key: string): Promise<void> {
  const db = await openDb()
  const existing = await new Promise<SyncQueueEntry | undefined>((resolve, reject) => {
    const request = tx(db, QUEUE_STORE, 'readonly').get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  if (!existing) return
  const updated: SyncQueueEntry = { ...existing, attempts: existing.attempts + 1, lastAttemptAt: Date.now() }
  return new Promise((resolve, reject) => {
    const request = tx(db, QUEUE_STORE, 'readwrite').put(updated)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function listQueuedSyncs(): Promise<SyncQueueEntry[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, QUEUE_STORE, 'readonly').getAll()
    request.onsuccess = () => resolve(request.result ?? [])
    request.onerror = () => reject(request.error)
  })
}
