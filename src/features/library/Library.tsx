import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useDocuments } from './useDocuments'
import { DocumentCard } from './DocumentCard'
import { CreateNotebookModal } from './CreateNotebookModal'
import { CreateSketchModal } from './CreateSketchModal'
import type { AppShellContext } from '../../app/AppShell'
import styles from './Library.module.css'

export type LibraryFilter = 'home' | 'all' | 'notebooks' | 'sketches' | 'favorites' | 'trash'

const TITLES: Record<LibraryFilter, string> = {
  home: 'Home',
  all: 'All Documents',
  notebooks: 'Notebooks',
  sketches: 'Sketches',
  favorites: 'Favorites',
  trash: 'Trash',
}

export function Library({ filter }: { filter: LibraryFilter }) {
  const { search } = useOutletContext<AppShellContext>()
  const { documents, loading } = useDocuments()
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [showSketchModal, setShowSketchModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return documents.filter((doc) => {
      if (filter === 'trash') {
        if (!doc.trashed) return false
      } else if (doc.trashed) {
        return false
      }
      if (filter === 'notebooks' && doc.type !== 'notebook') return false
      if (filter === 'sketches' && doc.type !== 'sketch') return false
      if (filter === 'favorites' && !doc.favorite) return false
      if (q) {
        const haystack = `${doc.title} ${doc.category ?? ''} ${doc.tags.join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [documents, filter, search])

  const showHomeExtras = filter === 'home'

  return (
    <div className={styles.wrap}>
      {showHomeExtras && (
        <div className={styles.ctaRow}>
          <Card interactive className={styles.ctaCard} onClick={() => setShowNotebookModal(true)}>
            <div className={styles.ctaIcon} style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
              ▥
            </div>
            <div>
              <div className={styles.ctaTitle}>Create Notebook</div>
              <div className={styles.ctaSubtitle}>Pages, templates, handwritten notes</div>
            </div>
          </Card>

          <Card interactive className={styles.ctaCard} onClick={() => setShowSketchModal(true)}>
            <div className={styles.ctaIcon} style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
              ✎
            </div>
            <div>
              <div className={styles.ctaTitle}>New Sketch</div>
              <div className={styles.ctaSubtitle}>Free canvas for drawing and ideas</div>
            </div>
          </Card>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{showHomeExtras ? 'Recent Documents' : TITLES[filter]}</h2>
        {!showHomeExtras && filter !== 'trash' && (
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => setShowNotebookModal(true)}>
              + Notebook
            </Button>
            <Button variant="secondary" onClick={() => setShowSketchModal(true)}>
              + Sketch
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Card className={styles.emptyState}>
          <p>Loading your documents…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className={styles.emptyState}>
          <p>{search ? 'No documents match your search.' : emptyMessage(filter)}</p>
          {!search && filter !== 'trash' && (
            <p className={styles.emptyStateHint}>Create your first notebook or sketch to see it here.</p>
          )}
        </Card>
      ) : (
        <div className={styles.grid}>
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {showNotebookModal && <CreateNotebookModal onClose={() => setShowNotebookModal(false)} />}
      {showSketchModal && <CreateSketchModal onClose={() => setShowSketchModal(false)} />}
    </div>
  )
}

function emptyMessage(filter: LibraryFilter): string {
  switch (filter) {
    case 'favorites':
      return 'No favorites yet.'
    case 'trash':
      return 'Trash is empty.'
    case 'notebooks':
      return 'No notebooks yet.'
    case 'sketches':
      return 'No sketches yet.'
    default:
      return 'No documents yet.'
  }
}
