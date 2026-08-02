import type { CanvasObject, StrokeObject, ShapeObject, TextObject, PenTool } from '../types'
import { PEN_PRESETS } from '../types'

/** Deterministic pseudo-random in [-1, 1], seeded by index — used only for
 * the soft-pencil grain jitter so re-renders are stable instead of flickering. */
function grain(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

function widthAt(obj: StrokeObject, index: number): number {
  if (obj.tool === 'eraser-pixel') return obj.baseWidth
  const preset = PEN_PRESETS[obj.tool as PenTool]
  const pressure = obj.points[index]?.pressure ?? 0.5
  const sensitivity = preset.pressureSensitivity
  const ratio = preset.minWidthRatio + (1 - preset.minWidthRatio) * pressure
  const width = obj.baseWidth * (1 - sensitivity + sensitivity * ratio)
  return preset.textured ? width * (1 + grain(index) * 0.12) : width
}

/**
 * Renders a stroke as a sequence of short quadratic-curve segments, each
 * through the midpoint of consecutive raw points (the standard "midpoint
 * smoothing" technique for canvas freehand drawing) with its own
 * interpolated line width. This avoids both the faceted look of a plain
 * polyline and the cost of building one giant path — each segment is cheap
 * and the whole stroke still reads as one continuous smooth line.
 */
export function renderStroke(ctx: CanvasRenderingContext2D, obj: StrokeObject) {
  const points = obj.points
  if (points.length === 0) return

  ctx.save()
  ctx.globalCompositeOperation = obj.composite
  ctx.globalAlpha = obj.opacity
  ctx.strokeStyle = obj.color
  ctx.fillStyle = obj.color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (points.length === 1) {
    const r = widthAt(obj, 0) / 2
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const midX = (p0.x + p1.x) / 2
    const midY = (p0.y + p1.y) / 2
    const prevMid = i === 0 ? p0 : { x: (points[i - 1].x + p0.x) / 2, y: (points[i - 1].y + p0.y) / 2 }

    ctx.beginPath()
    ctx.moveTo(prevMid.x, prevMid.y)
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
    ctx.lineWidth = widthAt(obj, i)
    ctx.stroke()
  }
  ctx.restore()
}

export function renderShape(ctx: CanvasRenderingContext2D, obj: ShapeObject) {
  ctx.save()
  ctx.globalAlpha = obj.opacity
  ctx.strokeStyle = obj.color
  ctx.lineWidth = obj.strokeWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.beginPath()
  if (obj.shapeType === 'shape-line') {
    ctx.moveTo(obj.x1, obj.y1)
    ctx.lineTo(obj.x2, obj.y2)
  } else if (obj.shapeType === 'shape-rect') {
    const x = Math.min(obj.x1, obj.x2)
    const y = Math.min(obj.y1, obj.y2)
    ctx.rect(x, y, Math.abs(obj.x2 - obj.x1), Math.abs(obj.y2 - obj.y1))
  } else {
    const cx = (obj.x1 + obj.x2) / 2
    const cy = (obj.y1 + obj.y2) / 2
    const rx = Math.abs(obj.x2 - obj.x1) / 2
    const ry = Math.abs(obj.y2 - obj.y1) / 2
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  }
  ctx.stroke()
  ctx.restore()
}

export function renderText(ctx: CanvasRenderingContext2D, obj: TextObject) {
  ctx.save()
  ctx.fillStyle = obj.color
  ctx.font = `${obj.fontSize}px var(--font-sans, sans-serif)`
  ctx.textBaseline = 'alphabetic'
  const lines = obj.text.split('\n')
  lines.forEach((line, i) => {
    ctx.fillText(line, obj.x, obj.y + i * obj.fontSize * 1.3)
  })
  ctx.restore()
}

export function renderObject(ctx: CanvasRenderingContext2D, obj: CanvasObject) {
  if (obj.kind === 'stroke') renderStroke(ctx, obj)
  else if (obj.kind === 'shape') renderShape(ctx, obj)
  else renderText(ctx, obj)
}
