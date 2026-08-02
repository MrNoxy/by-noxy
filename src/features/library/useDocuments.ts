import { useEffect, useState } from 'react'
import { useAuthContext } from '../auth/AuthContext'
import { subscribeToDocuments } from '../../services/documentsService'
import type { NoteyDocument } from '../../types/document'

export function useDocuments() {
  const { user } = useAuthContext()
  const [documents, setDocuments] = useState<NoteyDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setDocuments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToDocuments(user.uid, (docs) => {
      setDocuments(docs)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  return { documents, loading }
}
