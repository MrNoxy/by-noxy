import type { Point, StabilizationLevel } from '../types'
import { STABILIZATION_WINDOW } from '../types'

/**
 * Stroke stabilization algorithm
 * ===============================
 * Raw pointer input (especially finger/mouse, and even Pencil at low speed)
 * is jittery — tiny sub-pixel direction changes that look like hand tremor
 * once rendered as a stroke outline. Goodnotes-style "stabilization" sliders
 * smooth this out. This implementation is a real weighted moving average
 * over the last N raw points, where N scales with the stabilization level:
 *
 *   off = 1 (no smoothing, raw point passes through)
 *   low = 3, medium = 6, high = 10, maximum = 16
 *
 * For each new raw point, we push it into a fixed-size ring buffer of recent
 * raw points, then emit a smoothed point equal to the *weighted* average of
 * the buffer — more recent points are weighted more heavily (linear ramp),
 * so the line still tracks the pen's actual direction instead of lagging
 * behind it indefinitely. This trades a small, deliberate amount of latency
 * (worse at higher stabilization) for a much cleaner line — the same trade
 * every stabilization implementation makes.
 *
 * The renderer then draws a further-smoothed *path* through these emitted
 * points using quadratic curves through midpoints (see engine/renderer.ts),
 * which removes the remaining polyline faceting. The two steps are
 * independent and complementary: this class smooths noisy input sampling;
 * the renderer smooths the geometric path.
 */
export class StrokeStabilizer {
  private buffer: Point[] = []
  private windowSize: number

  constructor(level: StabilizationLevel) {
    this.windowSize = STABILIZATION_WINDOW[level]
  }

  /** Feed one raw pointer sample, get back the smoothed point to append to the stroke. */
  push(raw: Point): Point {
    this.buffer.push(raw)
    if (this.buffer.length > this.windowSize) this.buffer.shift()

    if (this.windowSize <= 1 || this.buffer.length === 1) return raw

    let totalWeight = 0
    let x = 0
    let y = 0
    let pressure = 0
    this.buffer.forEach((p, i) => {
      // Linear ramp: the most recent sample gets weight = buffer.length,
      // the oldest gets weight = 1.
      const weight = i + 1
      totalWeight += weight
      x += p.x * weight
      y += p.y * weight
      pressure += p.pressure * weight
    })

    return { x: x / totalWeight, y: y / totalWeight, pressure: pressure / totalWeight }
  }

  reset() {
    this.buffer = []
  }
}
