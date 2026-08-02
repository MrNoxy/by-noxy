import { useState } from 'react'
import { exportSketchImage, exportNotebookPagePNG, exportNotebookPagePDF } from './engine/exportService'
import type { Layer } from './types'
import type { NoteyDocument } from '../../types/document'
import styles from './ExportMenu.module.css'

export function ExportMenu({ doc, layers }: { doc: NoteyDocument; layers: Layer[] }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const filenameBase = doc.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'notey-export'

  async function run(action: () => void | Promise<void>) {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)} disabled={busy}>
        ⬇ Export
      </button>
      {open && (
        <div className={styles.menu} onMouseLeave={() => setOpen(false)}>
          {doc.type === 'sketch' ? (
            <>
              <button onClick={() => run(() => exportSketchImage(layers, doc.width, doc.height, 'png', false, doc.backgroundColor, filenameBase))}>
                PNG
              </button>
              <button
                onClick={() =>
                  run(() => exportSketchImage(layers, doc.width, doc.height, 'png', true, doc.backgroundColor, `${filenameBase}-transparent`))
                }
              >
                PNG (Transparent)
              </button>
              <button onClick={() => run(() => exportSketchImage(layers, doc.width, doc.height, 'jpeg', false, doc.backgroundColor, filenameBase))}>
                JPEG
              </button>
              <button onClick={() => run(() => exportSketchImage(layers, doc.width, doc.height, 'webp', false, doc.backgroundColor, filenameBase))}>
                WEBP
              </button>
            </>
          ) : (
            <>
              <button onClick={() => run(() => exportNotebookPagePDF(layers, 1240, 1754, filenameBase))}>PDF (this page)</button>
              <button onClick={() => run(() => exportNotebookPagePNG(layers, 1240, 1754, filenameBase))}>PNG (this page)</button>
              <div className={styles.note}>Multi-page notebooks aren&rsquo;t built yet, so this exports the single page that exists.</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
