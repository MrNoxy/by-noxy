import { ref, push, set, update, remove, onValue, get, serverTimestamp, type Unsubscribe } from 'firebase/database'
import { database } from '../firebase/firebase'
import type {
  NoteyDocument,
  NotebookDocument,
  SketchDocument,
  CreateNotebookInput,
  CreateSketchInput,
} from '../types/document'

/**
 * Data lives at users/{uid}/documents/{docId}. Every function here takes the
 * uid explicitly rather than reading it from a global — this keeps the
 * service pure and testable, and makes it impossible to accidentally read or
 * write another user's path.
 */
function documentsRef(uid: string) {
  return ref(database, `users/${uid}/documents`)
}

function documentRef(uid: string, docId: string) {
  return ref(database, `users/${uid}/documents/${docId}`)
}

/** Subscribes to the user's full document set in real time. Returns the
 *  unsubscribe function; callers must invoke it on unmount. */
export function subscribeToDocuments(uid: string, onChange: (docs: NoteyDocument[]) => void): Unsubscribe {
  return onValue(documentsRef(uid), (snapshot) => {
    const value = snapshot.val() as Record<string, NoteyDocument> | null
    const docs = value ? Object.values(value) : []
    docs.sort((a, b) => b.updatedAt - a.updatedAt)
    onChange(docs)
  })
}

export async function createNotebook(uid: string, input: CreateNotebookInput): Promise<string> {
  const newRef = push(documentsRef(uid))
  const id = newRef.key
  if (!id) throw new Error('Failed to allocate a document id.')

  const doc: NotebookDocument = {
    id,
    type: 'notebook',
    title: input.title.trim() || 'Untitled Notebook',
    cover: input.cover,
    category: input.category,
    tags: input.tags,
    favorite: false,
    trashed: false,
    trashedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    template: input.template,
    paperSize: input.paperSize,
    orientation: input.orientation,
    pageCount: 1,
  }

  await set(newRef, { ...doc, updatedAt: serverTimestamp(), createdAt: serverTimestamp() })
  return id
}

export async function createSketch(uid: string, input: CreateSketchInput): Promise<string> {
  const newRef = push(documentsRef(uid))
  const id = newRef.key
  if (!id) throw new Error('Failed to allocate a document id.')

  const doc: SketchDocument = {
    id,
    type: 'sketch',
    title: input.title.trim() || 'Untitled Sketch',
    cover: input.cover,
    category: input.category,
    tags: input.tags,
    favorite: false,
    trashed: false,
    trashedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    width: input.width,
    height: input.height,
    transparentBackground: input.transparentBackground,
    backgroundColor: input.backgroundColor,
  }

  await set(newRef, { ...doc, updatedAt: serverTimestamp(), createdAt: serverTimestamp() })
  return id
}

export async function getDocument(uid: string, docId: string): Promise<NoteyDocument | null> {
  const snapshot = await get(documentRef(uid, docId))
  return snapshot.exists() ? (snapshot.val() as NoteyDocument) : null
}

export async function renameDocument(uid: string, docId: string, title: string): Promise<void> {
  await update(documentRef(uid, docId), { title: title.trim() || 'Untitled', updatedAt: serverTimestamp() })
}

export async function toggleFavorite(uid: string, docId: string, favorite: boolean): Promise<void> {
  await update(documentRef(uid, docId), { favorite, updatedAt: serverTimestamp() })
}

export async function moveToTrash(uid: string, docId: string): Promise<void> {
  await update(documentRef(uid, docId), { trashed: true, trashedAt: Date.now(), updatedAt: serverTimestamp() })
}

export async function restoreFromTrash(uid: string, docId: string): Promise<void> {
  await update(documentRef(uid, docId), { trashed: false, trashedAt: null, updatedAt: serverTimestamp() })
}

export async function deletePermanently(uid: string, docId: string): Promise<void> {
  await remove(documentRef(uid, docId))
}

export async function duplicateDocument(uid: string, doc: NoteyDocument): Promise<string> {
  const newRef = push(documentsRef(uid))
  const id = newRef.key
  if (!id) throw new Error('Failed to allocate a document id.')

  const copy: NoteyDocument = {
    ...doc,
    id,
    title: `${doc.title} copy`,
    favorite: false,
    trashed: false,
    trashedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await set(newRef, { ...copy, updatedAt: serverTimestamp(), createdAt: serverTimestamp() })
  return id
}
