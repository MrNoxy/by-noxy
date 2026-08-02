export type DocumentType = 'notebook' | 'sketch'

export type CoverKind = 'color' | 'gradient'

export interface DocumentCover {
  kind: CoverKind
  /** For 'color': a single hex value. For 'gradient': "from,to" hex pair. */
  value: string
}

export const NOTEBOOK_TEMPLATES = [
  'Blank',
  'Lined',
  'College Ruled',
  'Graph',
  'Dotted',
  'Cornell Notes',
  'Planner',
  'Weekly Planner',
  'Monthly Planner',
  'Music',
  'Engineering',
  'Math',
  'Storyboard',
] as const
export type NotebookTemplate = (typeof NOTEBOOK_TEMPLATES)[number]

export const PAPER_SIZES = ['A4', 'Letter', 'Square', 'Custom'] as const
export type PaperSize = (typeof PAPER_SIZES)[number]

export type Orientation = 'portrait' | 'landscape'

export interface SketchPreset {
  label: string
  width: number
  height: number
}

export const SKETCH_PRESETS: SketchPreset[] = [
  { label: 'Square', width: 2000, height: 2000 },
  { label: 'Portrait', width: 1668, height: 2388 },
  { label: 'Landscape', width: 2388, height: 1668 },
  { label: 'iPad Screen', width: 2420, height: 1668 },
  { label: 'Instagram', width: 1080, height: 1350 },
  { label: 'A4', width: 2480, height: 3508 },
  { label: 'Letter', width: 2550, height: 3300 },
]

/** Base fields shared by every document, notebook or sketch. */
export interface DocumentBase {
  id: string
  type: DocumentType
  title: string
  cover: DocumentCover
  category: string | null
  tags: string[]
  favorite: boolean
  trashed: boolean
  trashedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface NotebookDocument extends DocumentBase {
  type: 'notebook'
  template: NotebookTemplate
  paperSize: PaperSize
  orientation: Orientation
  pageCount: number
}

export interface SketchDocument extends DocumentBase {
  type: 'sketch'
  width: number
  height: number
  transparentBackground: boolean
  backgroundColor: string
}

export type NoteyDocument = NotebookDocument | SketchDocument

export interface CreateNotebookInput {
  title: string
  cover: DocumentCover
  category: string | null
  tags: string[]
  template: NotebookTemplate
  paperSize: PaperSize
  orientation: Orientation
}

export interface CreateSketchInput {
  title: string
  cover: DocumentCover
  category: string | null
  tags: string[]
  width: number
  height: number
  transparentBackground: boolean
  backgroundColor: string
}
