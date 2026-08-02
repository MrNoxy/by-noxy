import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useAuthContext } from '../auth/AuthContext'
import { getDocument } from '../../services/documentsService'
import type { NoteyDocument } from '../../types/document'
import styles from './DocumentDetail.module.css'

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<NoteyDocument | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !id) return
    let cancelled = false
    setLoading(true)
    getDocument(user.uid, id).then((result) => {
      if (!cancelled) {
        setDoc(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user, id])

  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        {loading ? (
          <p>Loading…</p>
        ) : !doc ? (
          <>
            <h2>Document not found</h2>
            <p>It may have been deleted, or the link is incorrect.</p>
          </>
        ) : (
          <>
            <div className={styles.swatch} style={{ background: doc.cover.value }} />
            <h2>{doc.title}</h2>
            <p>
              The {doc.type === 'notebook' ? 'notebook' : 'sketch'} record is saved and syncing in Realtime Database.
              The canvas editor itself — pens, layers, undo/redo, the actual drawing surface — is{' '}
              <strong>Phase 3</strong> of the build and isn&rsquo;t implemented yet, so there&rsquo;s nothing to open
              here yet. This screen is just confirming the document really exists, not standing in for the editor.
            </p>
            {doc.type === 'notebook' ? (
              <ul className={styles.factList}>
                <li>Template: {doc.template}</li>
                <li>Paper size: {doc.paperSize}</li>
                <li>Orientation: {doc.orientation}</li>
              </ul>
            ) : (
              <ul className={styles.factList}>
                <li>Canvas: {doc.width} × {doc.height}px</li>
                <li>Background: {doc.transparentBackground ? 'Transparent' : doc.backgroundColor}</li>
              </ul>
            )}
          </>
        )}
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Library
        </Button>
      </Card>
    </div>
  )
}
