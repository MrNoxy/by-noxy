import { useEffect, useRef, useState, useCallback } from 'react'
import { cacheKey, saveCanvasCache, enqueueSync, dequeueSync, recordSyncAttempt, type CachedCanvasPayload } from '../../services/indexedDb'
import { pushCanvasToCloud } from '../../services/canvasSyncService'
import { flushSyncQueue } from '../../services/syncQueue'
import type { Layer } from './types'

export type SaveStatus = 'idle' | 'saved-local' | 'syncing' | 'synced' | 'offline-queued' | 'error'

const LOCAL_SAVE_DEBOUNCE_MS = 500
const CLOUD_PUSH_DEBOUNCE_MS = 1200
const MAX_RETRY_ATTEMPTS = 5
const RETRY_BASE_DELAY_MS = 2000

export function useAutosave(uid: string | null, docId: string | undefined, layers: Layer[], activeLayerId: string, isConnected: boolean) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)

  const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const isFirstRunRef = useRef(true)
  const isConnectedRef = useRef(isConnected)
  isConnectedRef.current = isConnected

  const pushNow = useCallback(
    async (payload: CachedCanvasPayload) => {
      if (!uid) return
      setStatus('syncing')
      try {
        await pushCanvasToCloud(uid, payload.docId, payload.layers, payload.activeLayerId)
        await dequeueSync(payload.key)
        retryCountRef.current = 0
        setStatus('synced')
        setLastSyncedAt(Date.now())
      } catch {
        await enqueueSync(payload)
        await recordSyncAttempt(payload.key)
        if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_BASE_DELAY_MS * 2 ** retryCountRef.current
          retryCountRef.current += 1
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
          retryTimerRef.current = setTimeout(() => {
            if (isConnectedRef.current) pushNow(payload)
          }, delay)
          setStatus('offline-queued')
        } else {
          setStatus('error')
        }
      }
    },
    [uid],
  )

  // On mount (and whenever connectivity is regained), try to flush anything
  // left over from a previous offline session for *any* document, not just
  // this one — otherwise a sketch edited offline yesterday would never get
  // pushed unless you happened to reopen that exact document.
  useEffect(() => {
    if (isConnected) flushSyncQueue()
  }, [isConnected])

  useEffect(() => {
    if (isFirstRunRef.current) {
      // Skip saving on the initial hydration render — there's nothing new
      // to persist yet, and it avoids a pointless write the instant a
      // document opens.
      isFirstRunRef.current = false
      return
    }
    if (!uid || !docId) return

    if (localTimerRef.current) clearTimeout(localTimerRef.current)
    if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current)

    const payload: CachedCanvasPayload = {
      key: cacheKey(uid, docId),
      uid,
      docId,
      layers,
      activeLayerId,
      updatedAt: Date.now(),
    }

    localTimerRef.current = setTimeout(() => {
      saveCanvasCache(payload).then(() => setStatus((s) => (s === 'idle' ? 'saved-local' : s)))
    }, LOCAL_SAVE_DEBOUNCE_MS)

    cloudTimerRef.current = setTimeout(() => {
      retryCountRef.current = 0
      if (isConnectedRef.current) {
        pushNow(payload)
      } else {
        enqueueSync(payload).then(() => setStatus('offline-queued'))
      }
    }, CLOUD_PUSH_DEBOUNCE_MS)

    return () => {
      if (localTimerRef.current) clearTimeout(localTimerRef.current)
      if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, activeLayerId, uid, docId])

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  const forceSync = useCallback(() => {
    if (!uid || !docId) return
    retryCountRef.current = 0
    pushNow({ key: cacheKey(uid, docId), uid, docId, layers, activeLayerId, updatedAt: Date.now() })
  }, [uid, docId, layers, activeLayerId, pushNow])

  return { status, lastSyncedAt, forceSync }
}
