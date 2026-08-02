import type { Command } from './commands'

export class UndoManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private onChange: () => void

  constructor(onChange: () => void) {
    this.onChange = onChange
  }

  execute(command: Command) {
    command.do()
    this.undoStack.push(command)
    this.redoStack = []
    this.onChange()
  }

  undo() {
    const command = this.undoStack.pop()
    if (!command) return
    command.undo()
    this.redoStack.push(command)
    this.onChange()
  }

  redo() {
    const command = this.redoStack.pop()
    if (!command) return
    command.do()
    this.undoStack.push(command)
    this.onChange()
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }
}
