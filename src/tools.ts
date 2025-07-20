import _ from 'lodash'
import { z, ZodSchema } from 'zod'
import env from './env.js'
import metadata from './metadata.js'
import schemas from './schemas.js'
import sources from './sources.js'
import storage from './storage.js'
import util from './util.js'

interface Tool<S extends ZodSchema = ZodSchema> {
  schema: S
  description: string
  isResource: boolean
  isReadOnly: boolean
  handler: (args: z.infer<S>) => any
}

const DELETED = 'Deleted'

const tools = {
  setup: defineTool({
    schema: z.object({
      path: z.string().min(1, `Path to a file, must be absolute (${storage.supportedExtensions().join(', ')})`),
    }),
    description: 'Initializes a source from a file path. It must be absolute. Creates file if it does not exist. Returns the source ID for further use',
    handler: (args) => {
      storage.getParser(args.path)
      // Register the source and get ID
      const { id } = sources.register(args.path)
      return getSummary(id)
    },
  }),

  search: defineTool({
    schema: z.object({
      source_id: schemas.sourceId,
      statuses: z.array(schemas.status).optional().describe('Specific statuses to get. Gets all if omitted'),
      terms: z.array(z.string()).optional().describe('Search terms to filter tasks by text or status (case-insensitive, OR logic)'),
      ids: schemas.ids.optional().describe('Optional list of task IDs to search for'),
    }),
    description: 'Search tasks from specific statuses with optional text & ID filtering',
    isReadOnly: true,
    handler: (args) => {
      const meta = metadata.load(args.source_id)
      const groups = args.statuses?.length ? args.statuses : meta.statuses
      let results = groups.flatMap(status => meta.groups[status] || [])

      if (args.ids) {
        results = results.filter(task => args.ids!.includes(task.id))
      }

      if (args.terms?.length) {
        results = results.filter(task => args.terms!.some(term =>
          util.fuzzySearch(`${task.text} ${task.status}`, term),
        ))
      }

      return results
    },
  }),

  add: defineTool({
    schema: z.object({
      source_id: schemas.sourceId,
      texts: z.array(z.string().min(1)).describe('Each text becomes a task'),
      status: schemas.status,
      index: schemas.index,
    }),
    description: 'Add new tasks with a specific status. It\'s faster and cheaper if you use this in batch, add all at once',
    handler: (args) => {
      let meta = metadata.load(args.source_id)
      const { source, state } = meta
      const { texts, status } = args
      // Remove existing tasks with same text from all groups (duplicate handling)
      for (const groupName of meta.statuses) {
        if (state.groups[groupName]) {
          state.groups[groupName] = state.groups[groupName].filter(text => !texts.includes(text))
        }
      }
      // Special handling for DELETED status - just remove tasks, don't add them anywhere
      if (status === DELETED) {
        storage.save(source.path, state)
        return getSummary(source.id, { tasks: [] })
      }
      // Ensure target status group exists
      if (!state.groups[status]) {
        state.groups[status] = []
      }
      const group = state.groups[status]
      const wip = state.groups[env.STATUS_WIP]
      const todos = state.groups[env.STATUS_TODO]
      if (args.status === env.STATUS_WIP && env.AUTO_WIP) {
        // Move all WIP but the first to ToDo
        todos.unshift(...wip)
        wip.length = 0
      }

      // Add new tasks at the specified index
      const index = util.clamp(args.index ?? group.length, 0, group.length)
      group.splice(index, 0, ...texts)
      if (env.AUTO_WIP && !wip.length && todos.length) {
        // Move first ToDo to WIP
        wip.push(todos.shift()!)
      }
      storage.save(source.path, state)
      // Re-load metadata after state changes
      meta = metadata.load(source.id)
      return getSummary(source.id, { tasks: _.compact(texts.map(t => meta.tasksByIdOrText[t])) })
    },
  }),

  update: defineTool({
    schema: z.object({
      source_id: schemas.sourceId,
      ids: schemas.ids,
      status: z.union([schemas.status, z.literal(DELETED)]).describe(util.trimLines(`
        ${schemas.status.description}
        - "${DELETED}" when they want these removed
      `)),
      index: schemas.index,
    }),
    description: 'Update tasks by ID to a different status. It\'s faster and cheaper if you use this in batch, update all at once',
    handler: (args) => {
      const meta = metadata.load(args.source_id)
      const texts = args.ids.map((id) => {
        const task = meta.tasksByIdOrText[id]
        if (task) {
          return task.text
        }
        if (util.isId(id)) {
          throw new Error(`Task ID ${id} not found`)
        }
        // Assume the AI passed a text for a new task by mistake
        return id
      })
      // Use add internally also for DELETED
      return tools.add.handler({
        source_id: args.source_id,
        status: args.status,
        index: args.index,
        texts,
      })
    },
  }),

  summary: defineTool({
    schema: z.object({
      source_id: schemas.sourceId,
    }),
    description: 'Get count of tasks in each status and the work-in-progress tasks',
    isReadOnly: true,
    handler: (args) => {
      return getSummary(args.source_id)
    },
  }),
} as const satisfies Record<string, Tool>

function getSummary(sourceId?: string, extra?: object) {
  const meta = metadata.load(sourceId)
  const counts = _.mapValues(meta.groups, tasks => tasks.length)
  return JSON.stringify({
    source: meta.source,
    ...counts,
    instructions: env.INSTRUCTIONS || undefined,
    wip: meta.groups[env.STATUS_WIP],
    ...extra,
  })
}

function defineTool<S extends ZodSchema>(tool: {
  schema: S
  description: string
  isResource?: boolean
  isReadOnly?: boolean
  handler: (args: z.infer<S>) => any
}) {
  return { ...tool, isResource: tool.isResource ?? false, isReadOnly: tool.isReadOnly ?? false }
}

export default tools
export type { Tool }
