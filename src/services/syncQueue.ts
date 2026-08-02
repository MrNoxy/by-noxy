import { listQueuedSyncs, dequeueSync, recordSyncAttempt } from './indexedDb'
import { pushCanvasToCloud } from './canvasSyncService'

let flushing = false

/** Attempts to push every locally-queued canvas change to Firebase. Safe to
 * call repeatedly/concurrently — a `flushing` guard prevents overlapping
 * runs, and each entry is only dequeued after a confirmed successful write,
 * so a flush that gets interrupted (e.g. connectivity drops again mid-way)
 * simply leaves the remaining entries queued for the next attempt. */
export async function flushSyncQueue(): Promise<{ succeeded: number; failed: number }> {
  if (flushing) return { succeeded: 0, failed: 0 }
  flushing = true
  let succeeded = 0
  let failed = 0
  try {
    const entries = await listQueuedSyncs()
    for (const entry of entries) {
      try {
        await pushCanvasToCloud(entry.uid, entry.docId, entry.payload.layers, entry.payload.activeLayerId)
        await dequeueSync(entry.key)
        succeeded++
      } catch {
        await recordSyncAttempt(entry.key)
        failed++
      }
    }
  } finally {
    flushing = false
  }
  return { succeeded, failed }
}
