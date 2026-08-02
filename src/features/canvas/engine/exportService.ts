import { jsPDF } from 'jspdf'
import { renderObject } from './renderer'
import type { Layer } from '../types'

/** Flattens all visible layers into one canvas, respecting each layer's own
 * opacity (drawn onto its own temp canvas first, then composited with
 * globalAlpha — the same technique the live editor uses, so exports match
 * exactly what you see on screen). `backgroundColor` of `null` leaves the
 * canvas transparent; anything else fills it first. */
function composeFlattenedCanvas(layers: Layer[], width: number, height: number, backgroundColor: string | null): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  layers.forEach((layer) => {
    if (!layer.visible) return
    const layerCanvas = document.createElement('canvas')
    layerCanvas.width = width
    layerCanvas.height = height
    const layerCtx = layerCanvas.getContext('2d')!
    layer.objects.forEach((obj) => renderObject(layerCtx, obj))

    ctx.save()
    ctx.globalAlpha = layer.opacity
    ctx.drawImage(layerCanvas, 0, 0)
    ctx.restore()
  })

  return canvas
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed to produce image data.'))),
      mimeType,
      quality,
    )
  })
}

export type ImageFormat = 'png' | 'jpeg' | 'webp'

export async function exportSketchImage(
  layers: Layer[],
  width: number,
  height: number,
  format: ImageFormat,
  transparent: boolean,
  backgroundColor: string,
  filenameBase: string,
): Promise<void> {
  // JPEG has no alpha channel — if transparency was requested but the
  // format can't represent it, we fill with the sketch's own background
  // color rather than silently producing a black background (the default
  // canvas fill when no color is set), and this is surfaced to the caller
  // via the return value so the UI can tell the person what happened.
  const effectiveTransparent = transparent && format !== 'jpeg'
  const canvas = composeFlattenedCanvas(layers, width, height, effectiveTransparent ? null : backgroundColor)
  const mime = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp'
  const blob = await canvasToBlob(canvas, mime, format === 'jpeg' ? 0.92 : undefined)
  downloadBlob(blob, `${filenameBase}.${format === 'jpeg' ? 'jpg' : format}`)
}

export async function exportNotebookPagePNG(layers: Layer[], width: number, height: number, filenameBase: string): Promise<void> {
  const canvas = composeFlattenedCanvas(layers, width, height, '#ffffff')
  const blob = await canvasToBlob(canvas, 'image/png')
  downloadBlob(blob, `${filenameBase}.png`)
}

/** Single-page PDF export. Multi-page notebooks aren't implemented yet
 * (Phase 3 built a single fixed page per notebook), so "export entire
 * notebook" and "export this page" are currently identical — this is
 * stated in the export menu, not hidden. */
export function exportNotebookPagePDF(layers: Layer[], widthPx: number, heightPx: number, filenameBase: string): void {
  const canvas = composeFlattenedCanvas(layers, widthPx, heightPx, '#ffffff')
  const dataUrl = canvas.toDataURL('image/png')

  // Convert from our page pixel dimensions (defined at ~150dpi) to mm for jsPDF.
  const DPI = 150
  const widthMm = (widthPx / DPI) * 25.4
  const heightMm = (heightPx / DPI) * 25.4

  const pdf = new jsPDF({ orientation: widthMm > heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [widthMm, heightMm] })
  pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm)
  pdf.save(`${filenameBase}.pdf`)
}
