import { PEN_PRESETS, PEN_TOOLS, SHAPE_TOOLS, type ToolId, type StabilizationLevel } from './types'
import { ColorPicker } from './ColorPicker'
import styles from './Toolbar.module.css'

const TOOL_LABELS: Partial<Record<ToolId, string>> = {
  'eraser-stroke': 'Eraser (Stroke)',
  'eraser-pixel': 'Eraser (Pixel)',
  lasso: 'Lasso',
  'shape-line': 'Line',
  'shape-rect': 'Rectangle',
  'shape-ellipse': 'Ellipse',
  text: 'Text',
}

const STABILIZATION_LEVELS: StabilizationLevel[] = ['off', 'low', 'medium', 'high', 'maximum']

export function Toolbar({
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
  hasSelection,
  onDeleteSelection,
}: {
  tool: ToolId
  setTool: (t: ToolId) => void
  color: string
  setColor: (c: string) => void
  baseWidth: number
  setBaseWidth: (w: number) => void
  stabilization: StabilizationLevel
  setStabilization: (s: StabilizationLevel) => void
  penOnlyMode: boolean
  setPenOnlyMode: (v: boolean) => void
  hasSelection: boolean
  onDeleteSelection: () => void
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        {PEN_TOOLS.map((t) => (
          <button
            key={t}
            className={`${styles.toolButton} ${tool === t ? styles.toolActive : ''}`}
            onClick={() => setTool(t)}
            title={PEN_PRESETS[t].label}
          >
            ✎
          </button>
        ))}
      </div>

      <div className={styles.group}>
        <button
          className={`${styles.toolButton} ${tool === 'eraser-stroke' ? styles.toolActive : ''}`}
          onClick={() => setTool('eraser-stroke')}
          title={TOOL_LABELS['eraser-stroke']}
        >
          ⌫
        </button>
        <button
          className={`${styles.toolButton} ${tool === 'eraser-pixel' ? styles.toolActive : ''}`}
          onClick={() => setTool('eraser-pixel')}
          title={TOOL_LABELS['eraser-pixel']}
        >
          ▭
        </button>
      </div>

      <div className={styles.group}>
        <button
          className={`${styles.toolButton} ${tool === 'lasso' ? styles.toolActive : ''}`}
          onClick={() => setTool('lasso')}
          title="Lasso select"
        >
          ⬚
        </button>
        {hasSelection && (
          <button className={styles.toolButton} onClick={onDeleteSelection} title="Delete selection">
            🗑
          </button>
        )}
      </div>

      <div className={styles.group}>
        {SHAPE_TOOLS.map((t) => (
          <button
            key={t}
            className={`${styles.toolButton} ${tool === t ? styles.toolActive : ''}`}
            onClick={() => setTool(t)}
            title={TOOL_LABELS[t]}
          >
            {t === 'shape-line' ? '/' : t === 'shape-rect' ? '▭' : '◯'}
          </button>
        ))}
        <button className={`${styles.toolButton} ${tool === 'text' ? styles.toolActive : ''}`} onClick={() => setTool('text')} title="Text">
          T
        </button>
      </div>

      <div className={styles.group}>
        <ColorPicker color={color} onChange={setColor} />
      </div>

      <div className={styles.sliderGroup}>
        <span className={styles.sliderLabel}>Size</span>
        <input type="range" min={1} max={40} value={baseWidth} onChange={(e) => setBaseWidth(Number(e.target.value))} />
      </div>

      <div className={styles.sliderGroup}>
        <span className={styles.sliderLabel}>Stabilization</span>
        <select value={stabilization} onChange={(e) => setStabilization(e.target.value as StabilizationLevel)}>
          {STABILIZATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <label className={styles.toggle}>
        <input type="checkbox" checked={penOnlyMode} onChange={(e) => setPenOnlyMode(e.target.checked)} />
        Pencil only
      </label>
    </div>
  )
}
