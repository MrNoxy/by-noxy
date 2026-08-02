import { useState } from 'react'
import type { Layer } from './types'
import type { CanvasAction } from './engine/canvasReducer'
import { Button } from '../../components/Button'
import styles from './LayersPanel.module.css'

export function LayersPanel({
  layers,
  activeLayerId,
  dispatch,
  onSelect,
  onAdd,
  onDelete,
}: {
  layers: Layer[]
  activeLayerId: string
  dispatch: (action: CanvasAction) => void
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function move(id: string, direction: -1 | 1) {
    const index = layers.findIndex((l) => l.id === id)
    const toIndex = index + direction
    if (toIndex < 0 || toIndex >= layers.length) return
    dispatch({ type: 'MOVE_LAYER', layerId: id, toIndex })
  }

  // Layers are rendered top-most-first in this panel (matching visual
  // stacking), so the array is reversed purely for display purposes.
  const displayLayers = [...layers].reverse()

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>Layers</h3>
        <Button variant="secondary" onClick={onAdd}>
          + Layer
        </Button>
      </div>

      <div className={styles.list}>
        {displayLayers.map((layer) => (
          <div key={layer.id} className={`${styles.row} ${layer.id === activeLayerId ? styles.rowActive : ''}`} onClick={() => onSelect(layer.id)}>
            <button
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'UPDATE_LAYER', layerId: layer.id, patch: { visible: !layer.visible } })
              }}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              {layer.visible ? '👁' : '⚊'}
            </button>

            <div className={styles.thumb} />

            <div className={styles.meta} onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(layer.id); setDraft(layer.name) }}>
              {renamingId === layer.id ? (
                <input
                  className={styles.renameInput}
                  autoFocus
                  value={draft}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    dispatch({ type: 'UPDATE_LAYER', layerId: layer.id, patch: { name: draft.trim() || layer.name } })
                    setRenamingId(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
              ) : (
                <span className={styles.name}>{layer.name}</span>
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={layer.opacity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => dispatch({ type: 'UPDATE_LAYER', layerId: layer.id, patch: { opacity: Number(e.target.value) } })}
              />
            </div>

            <button
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'UPDATE_LAYER', layerId: layer.id, patch: { locked: !layer.locked } })
              }}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.locked ? '🔒' : '🔓'}
            </button>

            <div className={styles.reorder}>
              <button className={styles.iconButtonSmall} onClick={(e) => { e.stopPropagation(); move(layer.id, 1) }} title="Move up">
                ▲
              </button>
              <button className={styles.iconButtonSmall} onClick={(e) => { e.stopPropagation(); move(layer.id, -1) }} title="Move down">
                ▼
              </button>
            </div>

            {layers.length > 1 && (
              <button
                className={styles.iconButton}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(layer.id)
                }}
                title="Delete layer"
              >
                🗑
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
