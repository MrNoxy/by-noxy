import { ref, get, set, serverTimestamp } from 'firebase/database'
import { database } from '../firebase/firebase'

/**
 * Canvas content (layers + their strokes) lives at a separate path from
 * document metadata (users/{uid}/documents/{docId}/canvas rather than
 * mixed into the document record itself). Strokes can get large and change
 * far more often than a title or tag list — keeping them apart means a
 * rename doesn't rewrite megabytes of stroke data, and vice versa.
 */
function canvasRef(uid: string, docId: string) {
  return ref(database, `users/${uid}/documents/${docId}/canvas`)
}

export interface RemoteCanvasPayload {
  layers: unknown
  activeLayerId: string
  updatedAt: number
}

export async function pushCanvasToCloud(uid: string, docId: string, layers: unknown, activeLayerId: string): Promise<void> {
  await set(canvasRef(uid, docId), {
    layers,
    activeLayerId,
    updatedAt: serverTimestamp(),
    updatedAtClient: Date.now(),
  })
}

export async function pullCanvasFromCloud(uid: string, docId: string): Promise<RemoteCanvasPayload | null> {
  const snapshot = await get(canvasRef(uid, docId))
  if (!snapshot.exists()) return null
  const value = snapshot.val()
  return {
    layers: value.layers,
    activeLayerId: value.activeLayerId,
    // updatedAtClient is set from Date.now() on the writing client, which is
    // what we compare against local cache timestamps for last-write-wins —
    // the serverTimestamp() sentinel isn't resolved until after the write,
    // so it can't be used for a same-request comparison like this.
    updatedAt: value.updatedAtClient ?? 0,
  }
}
