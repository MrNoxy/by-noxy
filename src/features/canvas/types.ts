export type PenTool =
  | 'pen-ballpoint'
  | 'pen-fountain'
  | 'marker'
  | 'highlighter'
  | 'pencil-soft'

export type ShapeTool = 'shape-line' | 'shape-rect' | 'shape-ellipse'

export type ToolId = PenTool | ShapeTool | 'eraser-stroke' | 'eraser-pixel' | 'lasso' | 'text'

export const PEN_TOOLS: PenTool[] = ['pen-ballpoint', 'pen-fountain', 'marker', 'highlighter', 'pencil-soft']
export const SHAPE_TOOLS: ShapeTool[] = ['shape-line', 'shape-rect', 'shape-ellipse']

/** Visual/behavioral profile for each pen. Every pen shares one stroke
 * renderer (see engine/renderer.ts) — these are the parameters that make
 * them feel different, not separate rendering implementations. Being
 * upfront: this is 5 real, distinct-feeling pens, not 8. Technical pen,
 * brush pen and mechanical pencil are omitted rather than shipped as
 * cosmetic renames of the same curve. */
export interface PenPreset {
  label: string
  baseOpacity: number
  /** How much pen pressure affects stroke width: 0 = constant width, 1 = fully pressure-driven. */
  pressureSensitivity: number
  /** Adds a slight per-segment width jitter to fake graphite/charcoal grain. */
  textured: boolean
  minWidthRatio: number
}

export const PEN_PRESETS: Record<PenTool, PenPreset> = {
  'pen-ballpoint': { label: 'Ballpoint', baseOpacity: 1, pressureSensitivity: 0.35, textured: false, minWidthRatio: 0.7 },
  'pen-fountain': { label: 'Fountain Pen', baseOpacity: 0.95, pressureSensitivity: 0.85, textured: false, minWidthRatio: 0.35 },
  marker: { label: 'Marker', baseOpacity: 0.9, pressureSensitivity: 0.1, textured: false, minWidthRatio: 0.95 },
  highlighter: { label: 'Highlighter', baseOpacity: 0.35, pressureSensitivity: 0, textured: false, minWidthRatio: 1 },
  'pencil-soft': { label: 'Soft Pencil', baseOpacity: 0.8, pressureSensitivity: 0.5, textured: true, minWidthRatio: 0.5 },
}

export type StabilizationLevel = 'off' | 'low' | 'medium' | 'high' | 'maximum'

export const STABILIZATION_WINDOW: Record<StabilizationLevel, number> = {
  off: 1,
  low: 3,
  medium: 6,
  high: 10,
  maximum: 16,
}

export interface Point {
  x: number
  y: number
  pressure: number
}

interface ObjectBase {
  id: string
  color: string
}

export interface StrokeObject extends ObjectBase {
  kind: 'stroke'
  tool: PenTool | 'eraser-pixel'
  baseWidth: number
  opacity: number
  points: Point[]
  /** 'destination-out' is what makes the pixel eraser genuinely erase
   * previously-drawn pixels on this layer, rather than painting white. */
  composite: GlobalCompositeOperation
}

export interface ShapeObject extends ObjectBase {
  kind: 'shape'
  shapeType: ShapeTool
  strokeWidth: number
  opacity: number
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface TextObject extends ObjectBase {
  kind: 'text'
  x: number
  y: number
  width: number
  text: string
  fontSize: number
}

export type CanvasObject = StrokeObject | ShapeObject | TextObject

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  objects: CanvasObject[]
}

export function createLayer(name: string): Layer {
  return {
    id: crypto.randomUUID(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    objects: [],
  }
}

export function objectBounds(obj: CanvasObject): { minX: number; minY: number; maxX: number; maxY: number } {
  if (obj.kind === 'stroke') {
    const xs = obj.points.map((p) => p.x)
    const ys = obj.points.map((p) => p.y)
    const pad = obj.baseWidth
    return { minX: Math.min(...xs) - pad, minY: Math.min(...ys) - pad, maxX: Math.max(...xs) + pad, maxY: Math.max(...ys) + pad }
  }
  if (obj.kind === 'shape') {
    const pad = obj.strokeWidth
    return {
      minX: Math.min(obj.x1, obj.x2) - pad,
      minY: Math.min(obj.y1, obj.y2) - pad,
      maxX: Math.max(obj.x1, obj.x2) + pad,
      maxY: Math.max(obj.y1, obj.y2) + pad,
    }
  }
  return { minX: obj.x, minY: obj.y - obj.fontSize, maxX: obj.x + obj.width, maxY: obj.y }
}
