import type { SaveStatus } from './useAutosave'
import styles from './SyncStatus.module.css'

const LABELS: Record<SaveStatus, string> = {
  idle: 'No changes yet',
  'saved-local': 'Saved on this device',
  syncing: 'Syncing…',
  synced: 'Synced',
  'offline-queued': 'Offline — will sync when back online',
  error: 'Sync failed — will retry',
}

export function SyncStatus({ status, isConnected, onRetry }: { status: SaveStatus; isConnected: boolean; onRetry: () => void }) {
  return (
    <div className={styles.wrap}>
      {!isConnected && <span className={styles.offlineDot} title="Offline" />}
      <span className={`${styles.label} ${styles[status]}`}>{LABELS[status]}</span>
      {(status === 'error' || status === 'offline-queued') && isConnected && (
        <button className={styles.retryButton} onClick={onRetry}>
          Retry now
        </button>
      )}
    </div>
  )
}
