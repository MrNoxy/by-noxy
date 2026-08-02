import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'
import { Button } from '../../components/Button'
import { useAuthContext } from '../auth/AuthContext'
import { createSketch } from '../../services/documentsService'
import { SKETCH_PRESETS } from '../../types/document'
import formStyles from './Form.module.css'

const BG_COLORS = ['#FFFFFF', '#F6F4EF', '#121214', '#3B82F6', '#F97316', '#22C55E']

export function CreateSketchModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [presetIndex, setPresetIndex] = useState(0)
  const [customWidth, setCustomWidth] = useState(2000)
  const [customHeight, setCustomHeight] = useState(2000)
  const [isCustom, setIsCustom] = useState(false)
  const [transparent, setTransparent] = useState(false)
  const [bgColor, setBgColor] = useState(BG_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const width = isCustom ? customWidth : SKETCH_PRESETS[presetIndex].width
  const height = isCustom ? customHeight : SKETCH_PRESETS[presetIndex].height

  async function handleCreate() {
    if (!user) return
    setError(null)
    setSubmitting(true)
    try {
      const id = await createSketch(user.uid, {
        title,
        cover: { kind: 'color', value: transparent ? '#94a3b8' : bgColor },
        category: null,
        tags: [],
        width,
        height,
        transparentBackground: transparent,
        backgroundColor: bgColor,
      })
      onClose()
      navigate(`/sketch/${id}`)
    } catch {
      setError('Couldn\u2019t create the sketch. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="New Sketch"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gradient" loading={submitting} disabled={!title.trim()} onClick={handleCreate}>
            Create Sketch
          </Button>
        </>
      }
    >
      {error && <div className={formStyles.error}>{error}</div>}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="sketch-title">
          Canvas Name
        </label>
        <input
          id="sketch-title"
          className={formStyles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Character concept"
          autoFocus
        />
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>Preset Size</span>
        <div className={formStyles.presetGrid}>
          {SKETCH_PRESETS.map((preset, index) => (
            <button
              key={preset.label}
              type="button"
              className={`${formStyles.presetButton} ${!isCustom && presetIndex === index ? formStyles.presetActive : ''}`}
              onClick={() => {
                setIsCustom(false)
                setPresetIndex(index)
              }}
            >
              <span className={formStyles.presetLabel}>{preset.label}</span>
              {preset.width} × {preset.height}
            </button>
          ))}
          <button
            type="button"
            className={`${formStyles.presetButton} ${isCustom ? formStyles.presetActive : ''}`}
            onClick={() => setIsCustom(true)}
          >
            <span className={formStyles.presetLabel}>Custom</span>
            Set your own size
          </button>
        </div>
      </div>

      {isCustom && (
        <div className={formStyles.row2}>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="width">
              Width (px)
            </label>
            <input
              id="width"
              type="number"
              min={64}
              max={8000}
              className={formStyles.input}
              value={customWidth}
              onChange={(e) => setCustomWidth(Number(e.target.value))}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="height">
              Height (px)
            </label>
            <input
              id="height"
              type="number"
              min={64}
              max={8000}
              className={formStyles.input}
              value={customHeight}
              onChange={(e) => setCustomHeight(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className={formStyles.toggleRow}>
        <span>Transparent Background</span>
        <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
      </div>

      {!transparent && (
        <div className={formStyles.field}>
          <span className={formStyles.label}>Background Color</span>
          <div className={formStyles.swatchGrid}>
            {BG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${formStyles.swatch} ${bgColor === c ? formStyles.swatchActive : ''}`}
                style={{ background: c, border: c === '#FFFFFF' ? '1px solid var(--border-strong)' : undefined }}
                onClick={() => setBgColor(c)}
                aria-label={`Background ${c}`}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
