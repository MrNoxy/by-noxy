import { useState } from 'react'
import styles from './ColorPicker.module.css'

const SWATCHES = ['#1c1c1e', '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#14B8A6', '#3B82F6', '#7C3AED', '#EC4899', '#FFFFFF']

export function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])

  function pick(c: string) {
    onChange(c)
    setRecent((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, 8))
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.swatchButton} style={{ background: color }} onClick={() => setOpen((v) => !v)} aria-label="Color" />
      {open && (
        <div className={styles.popover} onMouseLeave={() => setOpen(false)}>
          <div className={styles.grid}>
            {SWATCHES.map((c) => (
              <button
                key={c}
                className={styles.swatch}
                style={{ background: c, border: c === '#FFFFFF' ? '1px solid var(--border-strong)' : undefined }}
                onClick={() => pick(c)}
              />
            ))}
          </div>
          {recent.length > 0 && (
            <>
              <div className={styles.label}>Recent</div>
              <div className={styles.grid}>
                {recent.map((c, i) => (
                  <button key={`${c}-${i}`} className={styles.swatch} style={{ background: c }} onClick={() => pick(c)} />
                ))}
              </div>
            </>
          )}
          <input
            type="text"
            className={styles.hexInput}
            value={color}
            onChange={(e) => onChange(e.target.value)}
            onBlur={(e) => pick(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
