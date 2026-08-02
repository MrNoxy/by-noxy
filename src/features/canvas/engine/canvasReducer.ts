import type { CanvasObject, Layer } from '../types'

export interface CanvasState {
  layers: Layer[]
  activeLayerId: string
}

export type CanvasAction =
  | { type: 'ADD_OBJECT'; layerId: string; object: CanvasObject }
  | { type: 'REMOVE_OBJECTS'; layerId: string; ids: string[] }
  /** Re-inserts previously removed objects — used by undo of an erase/delete command. */
  | { type: 'INSERT_OBJECTS'; layerId: string; objects: CanvasObject[] }
  | { type: 'UPDATE_OBJECT'; layerId: string; id: string; patch: Partial<CanvasObject> }
  | { type: 'ADD_LAYER'; layer: Layer; index: number }
  | { type: 'REMOVE_LAYER'; layerId: string }
  | { type: 'UPDATE_LAYER'; layerId: string; patch: Partial<Layer> }
  | { type: 'MOVE_LAYER'; layerId: string; toIndex: number }
  | { type: 'SET_ACTIVE_LAYER'; layerId: string }

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_OBJECT':
      return {
        ...state,
        layers: state.layers.map((l) => (l.id === action.layerId ? { ...l, objects: [...l.objects, action.object] } : l)),
      }

    case 'REMOVE_OBJECTS':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId ? { ...l, objects: l.objects.filter((o) => !action.ids.includes(o.id)) } : l,
        ),
      }

    case 'INSERT_OBJECTS':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId ? { ...l, objects: [...l.objects, ...action.objects] } : l,
        ),
      }

    case 'UPDATE_OBJECT':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId
            ? { ...l, objects: l.objects.map((o) => (o.id === action.id ? ({ ...o, ...action.patch } as CanvasObject) : o)) }
            : l,
        ),
      }

    case 'ADD_LAYER': {
      const layers = [...state.layers]
      layers.splice(action.index, 0, action.layer)
      return { ...state, layers, activeLayerId: action.layer.id }
    }

    case 'REMOVE_LAYER': {
      const layers = state.layers.filter((l) => l.id !== action.layerId)
      const activeLayerId = state.activeLayerId === action.layerId ? (layers[0]?.id ?? '') : state.activeLayerId
      return { ...state, layers, activeLayerId }
    }

    case 'UPDATE_LAYER':
      return { ...state, layers: state.layers.map((l) => (l.id === action.layerId ? { ...l, ...action.patch } : l)) }

    case 'MOVE_LAYER': {
      const fromIndex = state.layers.findIndex((l) => l.id === action.layerId)
      if (fromIndex === -1) return state
      const layers = [...state.layers]
      const [moved] = layers.splice(fromIndex, 1)
      layers.splice(action.toIndex, 0, moved)
      return { ...state, layers }
    }

    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.layerId }

    default:
      return state
  }
}
