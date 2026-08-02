import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../firebase/firebase'

/**
 * navigator.onLine only tells you the OS thinks it has a network interface
 * up — it says nothing about whether Firebase's own socket is actually
 * connected (captive portals, firewalled Realtime Database ports, etc. all
 * report "online" while writes silently fail). Firebase's special
 * `.info/connected` path reflects the real state of that socket, so it's
 * the authoritative signal for "will a write actually go through right
 * now." We still seed from navigator.onLine so the UI has a sensible guess
 * before Firebase's first connection event arrives.
 */
export function useConnectivity(): boolean {
  const [connected, setConnected] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

  useEffect(() => {
    const infoRef = ref(database, '.info/connected')
    const unsubscribe = onValue(infoRef, (snapshot) => {
      setConnected(snapshot.val() === true)
    })
    return unsubscribe
  }, [])

  return connected
}
