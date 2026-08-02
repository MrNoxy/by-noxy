import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthContext } from '../auth/AuthContext'
import { getDocument } from '../../services/documentsService'
import type { NoteyDocument } from '../../types/document'
import { useCanvasEngine } from './useCanvasEngine'
import { Toolbar } from './Toolbar'
import { LayersPanel } from './LayersPanel'
import { LoadingScreen } from '../../components/LoadingScreen'
import styles from './CanvasEditor.module.css'

const DEFAULT_NOTEBOOK_PAGE = { width: 1240, height: 1754 } // ~A4 at 150dpi

export function CanvasEditor() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<NoteyDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [textDraft, setTextDraft] = useState('')

  useEffect(() => {
    if (!user || !id) return
    let cancelled = false
    getDocument(user.uid, id).then((result) => {
      if (!cancelled) {
        setDoc(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user, id])

  const width = doc?.type === 'sketch' ? doc.width : DEFAULT_NOTEBOOK_PAGE.width
  const height = doc?.type === 'sketch' ? doc.height : DEFAULT_NOTEBOOK_PAGE.height

  const engine = useCanvasEngine(width, height)

  useEffect(() => {
    const canvas = engine.canvasRef.current
    if (!canvas) return
    canvas.width = width * engine.dpr
    canvas.height = height * engine.dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, engine.dpr, doc])

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

  if (loading) return <LoadingScreen />
  if (!doc) {
    return (
      <div className={styles.notFound}>
        <p>Document not found.</p>
        <button onClick={() => navigate('/')}>Back to Library</button>
      </div>
    )
  }

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

      <div className={styles.autosaveNotice}>
        Not saved yet — strokes only persist for this browser tab. Cloud autosave for drawings lands in Phase 4.
      </div>
    </div>
  )
}
