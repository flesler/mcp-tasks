import sources from './sources.js'
import storage from './storage.js'
import { Metadata, Task } from './types.js'
import util from './util.js'

const metadata = {
  load(sourceId?: string): Metadata {
    const source = sources.require(sourceId)
    const state = storage.load(source.path)
    const statuses = util.keysOf(state.groups)

    const groups: Record<string, Task[]> = {}
    const tasks: Task[] = []
    const tasksByIdOrText: Record<string, Task> = {}

    for (const status of statuses) {
      const taskTexts = state.groups[status] || []
      groups[status] = taskTexts.map((text, index) => {
        const id = util.generateId(text)
        const task: Task = { id, text, status, index }
        tasks.push(task)
        tasksByIdOrText[id] = task
        tasksByIdOrText[text] = task
        return task
      })
    }
    return { source, state, groups, tasks, tasksByIdOrText, statuses }
  },
}

export default metadata
