import type { CanvasAction } from './canvasReducer'
import type { CanvasObject, Layer } from '../types'

export interface Command {
  label: string
  do(): void
  undo(): void
}

type Dispatch = (action: CanvasAction) => void

export function addObjectCommand(dispatch: Dispatch, layerId: string, object: CanvasObject): Command {
  return {
    label: 'Draw',
    do: () => dispatch({ type: 'ADD_OBJECT', layerId, object }),
    undo: () => dispatch({ type: 'REMOVE_OBJECTS', layerId, ids: [object.id] }),
  }
}

/** Used by the stroke eraser and by deleting a lasso selection. Undo
 * re-inserts the removed objects — they're appended rather than spliced
 * back to their exact original index, so an undone erase can render on top
 * of anything drawn after it instead of underneath; a known, documented
 * simplification rather than a hidden one. */
export function removeObjectsCommand(dispatch: Dispatch, layerId: string, objects: CanvasObject[]): Command {
  const ids = objects.map((o) => o.id)
  return {
    label: 'Erase',
    do: () => dispatch({ type: 'REMOVE_OBJECTS', layerId, ids }),
    undo: () => dispatch({ type: 'INSERT_OBJECTS', layerId, objects }),
  }
}

export function moveObjectsCommand(
  dispatch: Dispatch,
  layerId: string,
  deltas: { id: string; dx: number; dy: number; object: CanvasObject }[],
): Command {
  function apply(sign: 1 | -1) {
    deltas.forEach(({ id, dx, dy, object }) => {
      if (object.kind === 'stroke') {
        dispatch({
          type: 'UPDATE_OBJECT',
          layerId,
          id,
          patch: { points: object.points.map((p) => ({ ...p, x: p.x + sign * dx, y: p.y + sign * dy })) },
        })
      } else if (object.kind === 'shape') {
        dispatch({
          type: 'UPDATE_OBJECT',
          layerId,
          id,
          patch: { x1: object.x1 + sign * dx, y1: object.y1 + sign * dy, x2: object.x2 + sign * dx, y2: object.y2 + sign * dy },
        })
      } else {
        dispatch({ type: 'UPDATE_OBJECT', layerId, id, patch: { x: object.x + sign * dx, y: object.y + sign * dy } })
      }
    })
  }
  return {
    label: 'Move selection',
    do: () => apply(1),
    undo: () => apply(-1),
  }
}

export function addLayerCommand(dispatch: Dispatch, layer: Layer, index: number): Command {
  return {
    label: 'Add layer',
    do: () => dispatch({ type: 'ADD_LAYER', layer, index }),
    undo: () => dispatch({ type: 'REMOVE_LAYER', layerId: layer.id }),
  }
}

export function removeLayerCommand(dispatch: Dispatch, layer: Layer, index: number): Command {
  return {
    label: 'Delete layer',
    do: () => dispatch({ type: 'REMOVE_LAYER', layerId: layer.id }),
    undo: () => dispatch({ type: 'ADD_LAYER', layer, index }),
  }
}

export function updateLayerCommand(dispatch: Dispatch, layerId: string, before: Partial<Layer>, after: Partial<Layer>): Command {
  return {
    label: 'Change layer',
    do: () => dispatch({ type: 'UPDATE_LAYER', layerId, patch: after }),
    undo: () => dispatch({ type: 'UPDATE_LAYER', layerId, patch: before }),
  }
}
