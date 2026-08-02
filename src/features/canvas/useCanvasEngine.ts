import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { canvasReducer, type CanvasState } from './engine/canvasReducer'
import { UndoManager } from './engine/UndoManager'
import { addObjectCommand, removeObjectsCommand, moveObjectsCommand, addLayerCommand, removeLayerCommand } from './engine/commands'
import { renderObject } from './engine/renderer'
import { StrokeStabilizer } from './engine/stabilizer'
import { createLayer, objectBounds } from './types'
import type { CanvasObject, Layer, Point, ToolId, PenTool, StabilizationLevel } from './types'

export interface Transform {
  scale: number
  offsetX: number
  offsetY: number
}

interface DragState {
  originalPositions: Map<string, CanvasObject>
  lastDx: number
  lastDy: number
}

const MIN_SCALE = 0.1
const MAX_SCALE = 8

export function useCanvasEngine(docWidth: number, docHeight: number) {
  const [state, dispatch] = useReducer(canvasReducer, undefined, (): CanvasState => {
    const layer = createLayer('Layer 1')
    return { layers: [layer], activeLayerId: layer.id }
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const [, forceRender] = useState(0)
  const undoManagerRef = useRef<UndoManager>(new UndoManager(() => forceRender((n) => n + 1)))

  const [tool, setTool] = useState<ToolId>('pen-ballpoint')
  const [color, setColor] = useState('#1c1c1e')
  const [baseWidth, setBaseWidth] = useState(4)
  const [stabilization, setStabilization] = useState<StabilizationLevel>('medium')
  const [penOnlyMode, setPenOnlyMode] = useState(false)
  const [selection, setSelection] = useState<string[]>([])
  const [transform, setTransform] = useState<Transform>({ scale: 1, offsetX: 0, offsetY: 0 })
  const [editingText, setEditingText] = useState<{ x: number; y: number; id: string | null } | null>(null)

  const toolRef = useRef(tool)
  toolRef.current = tool
  const penOnlyRef = useRef(penOnlyMode)
  penOnlyRef.current = penOnlyMode
  const transformRef = useRef(transform)
  transformRef.current = transform
  const selectionRef = useRef(selection)
  selectionRef.current = selection

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const layerObjectsRenderedRef = useRef<Map<string, CanvasObject[]>>(new Map())
  const activeObjectRef = useRef<CanvasObject | null>(null)
  const lassoPathRef = useRef<Point[] | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const strokeBuilderRef = useRef<{ stabilizer: StrokeStabilizer } | null>(null)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStateRef = useRef<{ startDist: number; startScale: number; midpoint: { x: number; y: number } } | null>(null)
  const rafRef = useRef<number | null>(null)
  const eraseAccumRef = useRef<CanvasObject[]>([])

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  function getLayerCanvas(layerId: string): HTMLCanvasElement {
    let c = layerCanvasesRef.current.get(layerId)
    const targetW = docWidth * dpr
    const targetH = docHeight * dpr
    if (!c) {
      c = document.createElement('canvas')
      c.width = targetW
      c.height = targetH
      layerCanvasesRef.current.set(layerId, c)
    } else if (c.width !== targetW || c.height !== targetH) {
      // The document's real dimensions arrived after this canvas was first
      // created against a placeholder size (e.g. a sketch's actual
      // width/height loads asynchronously). Resizing clears the canvas,
      // which is safe here because it only happens before the user has had
      // a chance to draw — the layer's `objects` array is the source of
      // truth and gets replayed on the very next redraw regardless.
      c.width = targetW
      c.height = targetH
      layerObjectsRenderedRef.current.delete(layerId)
    }
    return c
  }

  const redrawLayer = useCallback(
    (layer: Layer) => {
      const canvas = getLayerCanvas(layer.id)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, docWidth, docHeight)
      layer.objects.forEach((obj) => renderObject(ctx, obj))
      layerObjectsRenderedRef.current.set(layer.id, layer.objects)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docWidth, docHeight, dpr],
  )

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { layers } = stateRef.current
    layers.forEach((layer) => {
      if (layerObjectsRenderedRef.current.get(layer.id) !== layer.objects) {
        redrawLayer(layer)
      }
    })

    const t = transformRef.current
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(t.scale * dpr, 0, 0, t.scale * dpr, t.offsetX * dpr, t.offsetY * dpr)

    layers.forEach((layer) => {
      if (!layer.visible) return
      const layerCanvas = layerCanvasesRef.current.get(layer.id)
      if (!layerCanvas) return
      ctx.save()
      ctx.globalAlpha = layer.opacity
      ctx.drawImage(layerCanvas, 0, 0, docWidth * dpr, docHeight * dpr, 0, 0, docWidth, docHeight)
      ctx.restore()
    })

    if (activeObjectRef.current) {
      renderObject(ctx, activeObjectRef.current)
    }

    if (lassoPathRef.current && lassoPathRef.current.length > 1) {
      ctx.save()
      ctx.setLineDash([6 / t.scale, 4 / t.scale])
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 1.5 / t.scale
      ctx.beginPath()
      lassoPathRef.current.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
      ctx.restore()
    }

    if (selectionRef.current.length > 0) {
      const activeLayer = stateRef.current.layers.find((l) => l.id === stateRef.current.activeLayerId)
      ctx.save()
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 1.5 / t.scale
      ctx.setLineDash([4 / t.scale, 3 / t.scale])
      activeLayer?.objects
        .filter((o) => selectionRef.current.includes(o.id))
        .forEach((o) => {
          const b = objectBounds(o)
          ctx.strokeRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY)
        })
      ctx.restore()
    }
  }, [redrawLayer, dpr, docWidth, docHeight])

  useEffect(() => {
    renderFrame()
  }, [state, transform, renderFrame])

  function startLoop() {
    if (rafRef.current != null) return
    const tick = () => {
      renderFrame()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  function stopLoop() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    renderFrame()
  }

  function toDocSpace(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const t = transformRef.current
    return { x: (clientX - rect.left - t.offsetX) / t.scale, y: (clientY - rect.top - t.offsetY) / t.scale }
  }

  function hitObject(objects: CanvasObject[], x: number, y: number, radius: number): CanvasObject | null {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if (obj.kind === 'stroke') {
        for (const p of obj.points) {
          if (Math.hypot(p.x - x, p.y - y) <= Math.max(radius, obj.baseWidth)) return obj
        }
      } else {
        const b = objectBounds(obj)
        if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) return obj
      }
    }
    return null
  }

  function pointInPolygon(x: number, y: number, poly: Point[]): boolean {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x
      const yi = poly[i].y
      const xj = poly[j].x
      const yj = poly[j].y
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
    return inside
  }

  function penOpacity(t: ToolId): number {
    if (t === 'highlighter') return 0.35
    if (t === 'marker') return 0.9
    if (t === 'pen-fountain') return 0.95
    if (t === 'pencil-soft') return 0.8
    return 1
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointersRef.current.size === 2) {
      activeObjectRef.current = null
      strokeBuilderRef.current = null
      const pts = Array.from(activePointersRef.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchStateRef.current = {
        startDist: dist,
        startScale: transformRef.current.scale,
        midpoint: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      }
      startLoop()
      return
    }
    if (activePointersRef.current.size > 2) return

    const currentTool = toolRef.current
    const isTouch = e.pointerType === 'touch'
    if (isTouch && penOnlyRef.current) return

    canvas.setPointerCapture(e.pointerId)
    const { x, y } = toDocSpace(e.clientX, e.clientY)
    const pressure = e.pressure > 0 ? e.pressure : 0.5
    const activeLayer = stateRef.current.layers.find((l) => l.id === stateRef.current.activeLayerId)
    if (!activeLayer || activeLayer.locked) return

    if (currentTool.startsWith('pen-') || currentTool === 'marker' || currentTool === 'highlighter' || currentTool === 'eraser-pixel') {
      strokeBuilderRef.current = { stabilizer: new StrokeStabilizer(stabilization) }
      const p = strokeBuilderRef.current.stabilizer.push({ x, y, pressure })
      activeObjectRef.current = {
        kind: 'stroke',
        id: crypto.randomUUID(),
        tool: currentTool as PenTool | 'eraser-pixel',
        color: currentTool === 'eraser-pixel' ? '#000000' : color,
        baseWidth,
        opacity: currentTool === 'eraser-pixel' ? 1 : penOpacity(currentTool),
        points: [p],
        composite: currentTool === 'eraser-pixel' ? 'destination-out' : 'source-over',
      }
      startLoop()
    } else if (currentTool === 'eraser-stroke') {
      eraseAccumRef.current = []
      const hit = hitObject(activeLayer.objects, x, y, baseWidth)
      if (hit) {
        eraseAccumRef.current.push(hit)
        dispatch({ type: 'REMOVE_OBJECTS', layerId: activeLayer.id, ids: [hit.id] })
      }
      startLoop()
    } else if (currentTool === 'shape-line' || currentTool === 'shape-rect' || currentTool === 'shape-ellipse') {
      activeObjectRef.current = {
        kind: 'shape',
        id: crypto.randomUUID(),
        shapeType: currentTool,
        color,
        strokeWidth: baseWidth,
        opacity: 1,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      }
      startLoop()
    } else if (currentTool === 'lasso') {
      const selected = activeLayer.objects.filter((o) => selectionRef.current.includes(o.id))
      const hitSelected = selected.find((o) => {
        const b = objectBounds(o)
        return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY
      })
      if (hitSelected && selectionRef.current.length > 0) {
        const originals = new Map<string, CanvasObject>()
        selectionRef.current.forEach((id) => {
          const obj = activeLayer.objects.find((o) => o.id === id)
          if (obj) originals.set(id, obj)
        })
        dragStateRef.current = { originalPositions: originals, lastDx: 0, lastDy: 0 }
        dragStartRef.current = { x, y }
      } else {
        lassoPathRef.current = [{ x, y, pressure: 1 }]
        setSelection([])
      }
      startLoop()
    } else if (currentTool === 'text') {
      setEditingText({ x, y, id: null })
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (activePointersRef.current.size === 2 && pinchStateRef.current) {
      const pts = Array.from(activePointersRef.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const midpoint = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      const { startDist, startScale, midpoint: startMid } = pinchStateRef.current
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * (dist / startDist)))
      setTransform((prev) => ({
        scale: newScale,
        offsetX: prev.offsetX + (midpoint.x - startMid.x),
        offsetY: prev.offsetY + (midpoint.y - startMid.y),
      }))
      pinchStateRef.current.midpoint = midpoint
      return
    }

    const currentTool = toolRef.current
    const activeLayer = stateRef.current.layers.find((l) => l.id === stateRef.current.activeLayerId)
    if (!activeLayer) return

    if (strokeBuilderRef.current && activeObjectRef.current?.kind === 'stroke') {
      const native = e.nativeEvent as PointerEvent
      const coalesced = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [native]
      const stroke = activeObjectRef.current
      coalesced.forEach((ev) => {
        const { x, y } = toDocSpace(ev.clientX, ev.clientY)
        const pressure = ev.pressure > 0 ? ev.pressure : 0.5
        const smoothed = strokeBuilderRef.current!.stabilizer.push({ x, y, pressure })
        stroke.points.push(smoothed)
      })
      return
    }

    if (dragStateRef.current) {
      const { x, y } = toDocSpace(e.clientX, e.clientY)
      const dx = x - dragStartRef.current.x
      const dy = y - dragStartRef.current.y
      dragStateRef.current.lastDx = dx
      dragStateRef.current.lastDy = dy
      dragStateRef.current.originalPositions.forEach((original, id) => {
        if (original.kind === 'stroke') {
          dispatch({
            type: 'UPDATE_OBJECT',
            layerId: activeLayer.id,
            id,
            patch: { points: original.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) },
          })
        } else if (original.kind === 'shape') {
          dispatch({
            type: 'UPDATE_OBJECT',
            layerId: activeLayer.id,
            id,
            patch: { x1: original.x1 + dx, y1: original.y1 + dy, x2: original.x2 + dx, y2: original.y2 + dy },
          })
        } else {
          dispatch({ type: 'UPDATE_OBJECT', layerId: activeLayer.id, id, patch: { x: original.x + dx, y: original.y + dy } })
        }
      })
      return
    }

    if (lassoPathRef.current) {
      const { x, y } = toDocSpace(e.clientX, e.clientY)
      lassoPathRef.current.push({ x, y, pressure: 1 })
      return
    }

    if (activeObjectRef.current?.kind === 'shape') {
      const { x, y } = toDocSpace(e.clientX, e.clientY)
      activeObjectRef.current.x2 = x
      activeObjectRef.current.y2 = y
      return
    }

    if (currentTool === 'eraser-stroke' && e.buttons === 1) {
      const { x, y } = toDocSpace(e.clientX, e.clientY)
      const hit = hitObject(activeLayer.objects, x, y, baseWidth)
      if (hit && !eraseAccumRef.current.includes(hit)) {
        eraseAccumRef.current.push(hit)
        dispatch({ type: 'REMOVE_OBJECTS', layerId: activeLayer.id, ids: [hit.id] })
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId)
    if (activePointersRef.current.size < 2) pinchStateRef.current = null
    if (activePointersRef.current.size > 0) return

    const activeLayer = stateRef.current.layers.find((l) => l.id === stateRef.current.activeLayerId)

    if (activeObjectRef.current && activeLayer) {
      const finished = activeObjectRef.current
      activeObjectRef.current = null
      strokeBuilderRef.current = null
      if (finished.kind !== 'stroke' || finished.points.length > 0) {
        undoManagerRef.current.execute(addObjectCommand(dispatch, activeLayer.id, finished))
      }
    }

    if (eraseAccumRef.current.length > 0 && activeLayer) {
      const removed = eraseAccumRef.current
      eraseAccumRef.current = []
      undoManagerRef.current.execute(removeObjectsCommand(dispatch, activeLayer.id, removed))
    }

    if (dragStateRef.current && activeLayer) {
      const { originalPositions, lastDx, lastDy } = dragStateRef.current
      dragStateRef.current = null
      if (Math.abs(lastDx) > 0.5 || Math.abs(lastDy) > 0.5) {
        const deltas = Array.from(originalPositions.entries()).map(([id, object]) => ({ id, dx: lastDx, dy: lastDy, object }))
        deltas.forEach(({ id, object }) => {
          dispatch({ type: 'UPDATE_OBJECT', layerId: activeLayer.id, id, patch: object })
        })
        undoManagerRef.current.execute(moveObjectsCommand(dispatch, activeLayer.id, deltas))
      }
    }

    if (lassoPathRef.current && activeLayer) {
      const path = lassoPathRef.current
      lassoPathRef.current = null
      if (path.length > 2) {
        const ids = activeLayer.objects
          .filter((o) => {
            const b = objectBounds(o)
            const cx = (b.minX + b.maxX) / 2
            const cy = (b.minY + b.maxY) / 2
            return pointInPolygon(cx, cy, path)
          })
          .map((o) => o.id)
        setSelection(ids)
      }
    }

    stopLoop()
  }

  const zoomBy = (factor: number) => {
    setTransform((prev) => ({ ...prev, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor)) }))
  }
  const resetView = () => setTransform({ scale: 1, offsetX: 0, offsetY: 0 })

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (e.ctrlKey) {
      zoomBy(Math.exp(-e.deltaY * 0.01))
    } else {
      setTransform((prev) => ({ ...prev, offsetX: prev.offsetX - e.deltaX, offsetY: prev.offsetY - e.deltaY }))
    }
  }

  const deleteSelection = () => {
    const activeLayer = stateRef.current.layers.find((l) => l.id === stateRef.current.activeLayerId)
    if (!activeLayer || selection.length === 0) return
    const objects = activeLayer.objects.filter((o) => selection.includes(o.id))
    undoManagerRef.current.execute(removeObjectsCommand(dispatch, activeLayer.id, objects))
    setSelection([])
  }

  const commitText = (text: string) => {
    if (!editingText) return
    const activeLayer = stateRef.current.layers.find((l) => l.id === stateRef.current.activeLayerId)
    if (activeLayer && text.trim()) {
      const obj: CanvasObject = {
        kind: 'text',
        id: crypto.randomUUID(),
        color,
        x: editingText.x,
        y: editingText.y,
        width: Math.max(120, text.length * 9),
        text,
        fontSize: Math.max(16, baseWidth * 4),
      }
      undoManagerRef.current.execute(addObjectCommand(dispatch, activeLayer.id, obj))
    }
    setEditingText(null)
  }

  const addLayer = () => {
    const layer = createLayer(`Layer ${state.layers.length + 1}`)
    undoManagerRef.current.execute(addLayerCommand(dispatch, layer, state.layers.length))
  }
  const deleteLayer = (layerId: string) => {
    const index = state.layers.findIndex((l) => l.id === layerId)
    const layer = state.layers[index]
    if (!layer || state.layers.length <= 1) return
    undoManagerRef.current.execute(removeLayerCommand(dispatch, layer, index))
    layerCanvasesRef.current.delete(layerId)
  }

  return {
    canvasRef,
    docWidth,
    docHeight,
    dpr,
    state,
    dispatch,
    tool,
    setTool,
    color,
    setColor,
    baseWidth,
    setBaseWidth,
    stabilization,
    setStabilization,
    penOnlyMode,
    setPenOnlyMode,
    selection,
    transform,
    zoomBy,
    resetView,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    deleteSelection,
    editingText,
    commitText,
    cancelText: () => setEditingText(null),
    addLayer,
    deleteLayer,
    undo: () => undoManagerRef.current.undo(),
    redo: () => undoManagerRef.current.redo(),
    canUndo: undoManagerRef.current.canUndo,
    canRedo: undoManagerRef.current.canRedo,
  }
}
