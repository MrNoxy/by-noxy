import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'
import { Button } from '../../components/Button'
import { useAuthContext } from '../auth/AuthContext'
import { createNotebook } from '../../services/documentsService'
import {
  NOTEBOOK_TEMPLATES,
  PAPER_SIZES,
  type NotebookTemplate,
  type PaperSize,
  type Orientation,
} from '../../types/document'
import formStyles from './Form.module.css'

const COVER_COLORS = ['#3B82F6', '#A855F7', '#22C55E', '#F97316', '#EF4444', '#EC4899', '#14B8A6', '#64748B']

export function CreateNotebookModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<NotebookTemplate>('Blank')
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [category, setCategory] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!user) return
    setError(null)
    setSubmitting(true)
    try {
      const id = await createNotebook(user.uid, {
        title,
        cover: { kind: 'color', value: coverColor },
        category: category.trim() || null,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        template,
        paperSize,
        orientation,
      })
      onClose()
      navigate(`/notebook/${id}`)
    } catch {
      setError('Couldn\u2019t create the notebook. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Create Notebook"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gradient" loading={submitting} disabled={!title.trim()} onClick={handleCreate}>
            Create Notebook
          </Button>
        </>
      }
    >
      {error && <div className={formStyles.error}>{error}</div>}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="notebook-title">
          Notebook Name
        </label>
        <input
          id="notebook-title"
          className={formStyles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Biology 201"
          autoFocus
        />
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>Cover Color</span>
        <div className={formStyles.swatchGrid}>
          {COVER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${formStyles.swatch} ${coverColor === c ? formStyles.swatchActive : ''}`}
              style={{ background: c }}
              onClick={() => setCoverColor(c)}
              aria-label={`Cover color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>Template</span>
        <div className={formStyles.chipGrid}>
          {NOTEBOOK_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              className={`${formStyles.chip} ${template === t ? formStyles.chipActive : ''}`}
              onClick={() => setTemplate(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={formStyles.row2}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="paper-size">
            Paper Size
          </label>
          <select
            id="paper-size"
            className={formStyles.select}
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
          >
            {PAPER_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="orientation">
            Orientation
          </label>
          <select
            id="orientation"
            className={formStyles.select}
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>

      <div className={formStyles.row2}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="category">
            Category
          </label>
          <input
            id="category"
            className={formStyles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="School"
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="tags">
            Tags
          </label>
          <input
            id="tags"
            className={formStyles.input}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="exam, chapter-3"
          />
        </div>
      </div>
    </Modal>
  )
}
