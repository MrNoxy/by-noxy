import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/Card'
import { useAuthContext } from '../auth/AuthContext'
import {
  toggleFavorite,
  moveToTrash,
  restoreFromTrash,
  deletePermanently,
  duplicateDocument,
  renameDocument,
} from '../../services/documentsService'
import type { NoteyDocument } from '../../types/document'
import styles from './DocumentCard.module.css'

function relativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function DocumentCard({ doc }: { doc: NoteyDocument }) {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [titleDraft, setTitleDraft] = useState(doc.title)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null
  const uid = user.uid

  function open() {
    if (renaming || menuOpen) return
    navigate(doc.type === 'notebook' ? `/notebook/${doc.id}` : `/sketch/${doc.id}`)
  }

  async function commitRename() {
    setRenaming(false)
    if (titleDraft.trim() && titleDraft.trim() !== doc.title) {
      await renameDocument(uid, doc.id, titleDraft.trim())
    } else {
      setTitleDraft(doc.title)
    }
  }

  const coverBackground =
    doc.cover.kind === 'gradient'
      ? `linear-gradient(135deg, ${doc.cover.value.split(',')[0]}, ${doc.cover.value.split(',')[1]})`
      : doc.cover.value

  return (
    <Card interactive className={styles.card} onClick={open}>
      <div className={styles.thumbnail} style={{ background: coverBackground }}>
        <span className={styles.typeBadge}>{doc.type === 'notebook' ? '▥' : '✎'}</span>
        <button
          className={styles.favoriteButton}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(uid, doc.id, !doc.favorite)
          }}
          aria-label={doc.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {doc.favorite ? '★' : '☆'}
        </button>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaText}>
          {renaming ? (
            <input
              className={styles.renameInput}
              value={titleDraft}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setTitleDraft(doc.title)
                  setRenaming(false)
                }
              }}
            />
          ) : (
            <div className={styles.title}>{doc.title}</div>
          )}
          <div className={styles.subtitle}>
            {doc.trashed ? 'Trashed' : 'Edited'} {relativeTime(doc.trashed ? doc.trashedAt ?? doc.updatedAt : doc.updatedAt)}
          </div>
        </div>

        <div className={styles.menuWrap} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            aria-label="Document options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
              {!doc.trashed ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setRenaming(true)
                    }}
                  >
                    Rename
                  </button>
                  <button onClick={() => { setMenuOpen(false); duplicateDocument(uid, doc) }}>Duplicate</button>
                  <button onClick={() => { setMenuOpen(false); toggleFavorite(uid, doc.id, !doc.favorite) }}>
                    {doc.favorite ? 'Remove favorite' : 'Add favorite'}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      navigate(doc.type === 'notebook' ? `/notebook/${doc.id}` : `/sketch/${doc.id}`)
                    }}
                    title="Export options (PDF/PNG/JPEG/WEBP) live in the editor's Export menu, since export needs the loaded canvas"
                  >
                    Open to Export…
                  </button>
                  <button disabled title="Real-time sharing is a future-ready feature, not yet built">
                    Share (planned)
                  </button>
                  <button className={styles.destructive} onClick={() => { setMenuOpen(false); moveToTrash(uid, doc.id) }}>
                    Move to Trash
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMenuOpen(false); restoreFromTrash(uid, doc.id) }}>Restore</button>
                  <button
                    className={styles.destructive}
                    onClick={() => {
                      setMenuOpen(false)
                      if (confirm(`Permanently delete "${doc.title}"? This can\u2019t be undone.`)) {
                        deletePermanently(uid, doc.id)
                      }
                    }}
                  >
                    Delete Permanently
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
