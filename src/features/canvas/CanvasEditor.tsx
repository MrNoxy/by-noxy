import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthContext } from '../auth/AuthContext'
import { getDocument } from '../../services/documentsService'
import { loadCanvasCache, saveCanvasCache, cacheKey } from '../../services/indexedDb'
import { pullCanvasFromCloud } from '../../services/canvasSyncService'
import { useConnectivity } from '../../hooks/useConnectivity'
import type { NoteyDocument } from '../../types/document'
import type { Layer } from './types'
import { useCanvasEngine } from './useCanvasEngine'
import { useAutosave } from './useAutosave'
import { Toolbar } from './Toolbar'
import { LayersPanel } from './LayersPanel'
import { ExportMenu } from './ExportMenu'
import { SyncStatus } from './SyncStatus'
import { LoadingScreen } from '../../components/LoadingScreen'
import styles from './CanvasEditor.module.css'

const DEFAULT_NOTEBOOK_PAGE = { width: 1240, height: 1754 } // ~A4 at 150dpi

interface HydratedState {
  doc: NoteyDocument
  initialLayers: Layer[]
  initialActiveLayerId: string
}

/**
 * Loader shell. Hooks like useCanvasEngine hydrate their state exactly once
 * on mount (via useReducer's lazy initializer), so the real editor can't be
 * mounted until we know what to hydrate it *with* — otherwise a document
 * loaded from the network after the first render would silently be
 * ignored. This component's only job is to resolve that data (metadata +
 * cached/remote canvas content) before rendering <CanvasEditorView>.
 */
export function CanvasEditor() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [hydrated, setHydrated] = useState<HydratedState | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!user || !id) return
    let cancelled = false

    async function load() {
      const doc = await getDocument(user!.uid, id!)
      if (cancelled) return
      if (!doc) {
        setNotFound(true)
        return
      }

      const local = await loadCanvasCache(user!.uid, id!).catch(() => null)
      const remote = await pullCanvasFromCloud(user!.uid, id!).catch(() => null)
      if (cancelled) return

      let initialLayers: Layer[] = []
      let initialActiveLayerId = ''

      // Last-write-wins by client timestamp — the simplest correct strategy
      // for a single-editor-at-a-time app. There's no operational-transform
      // or field-level merge here; if the same document were edited offline
      // on two devices, whichever synced last would win outright. Documented
      // as a real limitation, not silently glossed over.
      if (remote && (!local || remote.updatedAt > local.updatedAt) && Array.isArray(remote.layers) && remote.layers.length > 0) {
        initialLayers = remote.layers as Layer[]
        initialActiveLayerId = remote.activeLayerId
        await saveCanvasCache({ key: cacheKey(user!.uid, id!), uid: user!.uid, docId: id!, layers: initialLayers, activeLayerId: initialActiveLayerId, updatedAt: remote.updatedAt })
      } else if (local && Array.isArray(local.layers) && local.layers.length > 0) {
        initialLayers = local.layers as Layer[]
        initialActiveLayerId = local.activeLayerId
      }

      setHydrated({ doc, initialLayers, initialActiveLayerId })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, id])

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <p>Document not found.</p>
        <button onClick={() => navigate('/')}>Back to Library</button>
      </div>
    )
  }

  if (!hydrated || !user) return <LoadingScreen />

  return <CanvasEditorView key={hydrated.doc.id} uid={user.uid} {...hydrated} />
}

function CanvasEditorView({
  uid,
  doc,
  initialLayers,
  initialActiveLayerId,
}: HydratedState & { uid: string }) {
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [textDraft, setTextDraft] = useState('')
  const isConnected = useConnectivity()

  const width = doc.type === 'sketch' ? doc.width : DEFAULT_NOTEBOOK_PAGE.width
  const height = doc.type === 'sketch' ? doc.height : DEFAULT_NOTEBOOK_PAGE.height

  const engine = useCanvasEngine(width, height, initialLayers.length > 0 ? { layers: initialLayers, activeLayerId: initialActiveLayerId } : undefined)
  const autosave = useAutosave(uid, doc.id, engine.state.layers, engine.state.activeLayerId, isConnected)

  useEffect(() => {
    const canvas = engine.canvasRef.current
    if (!canvas) return
    canvas.width = width * engine.dpr
    canvas.height = height * engine.dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, engine.dpr])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        engine.undo()
      } else if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        engine.redo()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (engine.selection.length > 0) engine.deleteSelection()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.selection])

  const textOverlayStyle = engine.editingText
    ? {
        left: engine.editingText.x * engine.transform.scale + engine.transform.offsetX,
        top: (engine.editingText.y - 20) * engine.transform.scale + engine.transform.offsetY,
      }
    : undefined

  return (
    <div className={styles.screen}>
      <header className={styles.topbar}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className={styles.title}>{doc.title}</div>
        <div className={styles.topbarRight}>
          <SyncStatus status={autosave.status} isConnected={isConnected} onRetry={autosave.forceSync} />
          <ExportMenu doc={doc} layers={engine.state.layers} />
          <button className={styles.iconTextButton} disabled={!engine.canUndo} onClick={engine.undo}>
            ↶ Undo
          </button>
          <button className={styles.iconTextButton} disabled={!engine.canRedo} onClick={engine.redo}>
            ↷ Redo
          </button>
          <div className={styles.zoomControls}>
            <button onClick={() => engine.zoomBy(0.8)}>−</button>
            <span>{Math.round(engine.transform.scale * 100)}%</span>
            <button onClick={() => engine.zoomBy(1.25)}>+</button>
            <button onClick={engine.resetView}>Reset</button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.canvasArea} ref={wrapperRef}>
          <div className={styles.floatingToolbar}>
            <Toolbar
              tool={engine.tool}
              setTool={engine.setTool}
              color={engine.color}
              setColor={engine.setColor}
              baseWidth={engine.baseWidth}
              setBaseWidth={engine.setBaseWidth}
              stabilization={engine.stabilization}
              setStabilization={engine.setStabilization}
              penOnlyMode={engine.penOnlyMode}
              setPenOnlyMode={engine.setPenOnlyMode}
              hasSelection={engine.selection.length > 0}
              onDeleteSelection={engine.deleteSelection}
            />
          </div>

          <div className={styles.viewport}>
            <canvas
              ref={engine.canvasRef}
              className={styles.canvas}
              onPointerDown={engine.onPointerDown}
              onPointerMove={engine.onPointerMove}
              onPointerUp={engine.onPointerUp}
              onPointerCancel={engine.onPointerUp}
              onWheel={engine.onWheel}
              style={{ touchAction: 'none' }}
            />
          </div>

          {engine.editingText && (
            <div className={styles.textOverlay} style={textOverlayStyle}>
              <textarea
                autoFocus
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onBlur={() => {
                  engine.commitText(textDraft)
                  setTextDraft('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    engine.cancelText()
                    setTextDraft('')
                  }
                }}
              />
            </div>
          )}
        </div>

        <LayersPanel
          layers={engine.state.layers}
          activeLayerId={engine.state.activeLayerId}
          dispatch={engine.dispatch}
          onSelect={(layerId) => engine.dispatch({ type: 'SET_ACTIVE_LAYER', layerId })}
          onAdd={engine.addLayer}
          onDelete={engine.deleteLayer}
        />
      </div>
    </div>
  )
}
