import _ from 'lodash'
import { z, ZodSchema } from 'zod'
import env from './env.js'
import metadata from './metadata.js'
import pkg from './pkg.js'
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

const tools = {
  setup: defineTool('setup', {
    schema: z.object({
      workspace: z.string().optional().describe('Workspace/project directory path (provided by the IDE or use $PWD)'),
      source_path: schemas.sourcePath,
    }),
    description: util.trimLines(`
      Initializes an source file from a path
      - Always call once per conversation when asked to use these tools
      - Ask the user to clarify the file path if not given, before calling this tool
      - Creates the file if it does not exist
      - Returns the source ID for further use
      ${env.INSTRUCTIONS ? `- ${env.INSTRUCTIONS}` : ''}
    `),
    handler: (args) => {
      // Until verified if we need backwards compatibility in schema
      const path = args.source_path || (args as any).path
      storage.getParser(path)
      // Register the source and get ID
      const source = sources.register(path, args.workspace)
      return getSummary(source.id)
    },
  }),

  search: defineTool('search', {
    schema: z.object({
      source_id: schemas.sourceId,
      statuses: z.array(schemas.status).optional().describe('Specific statuses to get. Gets all if omitted'),
      terms: z.array(z.string()).optional().describe('Search terms to filter tasks by text or status (case-insensitive, OR logic, no regex or wildcards)'),
      ids: schemas.ids.optional().describe('Optional list of task IDs to search for'),
      limit: z.number().int().min(1).optional().describe('Maximum number of results (only for large task lists)'),
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
      if (args.limit) {
        results = results.slice(0, args.limit)
      }
      return results
    },
  }),

  add: defineTool('add', {
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
      let group = state.groups[status]
      // Special handling for Deleted and other unknown statuses
      if (!group) {
        storage.save(source.path, state)
        return getSummary(source.id, { tasks: [] })
      }
      const wip = state.groups[env.STATUS_WIP]
      const todos = state.groups[env.STATUS_TODO]
      if (env.AUTO_WIP && args.status === env.STATUS_WIP) {
        // Move all WIP but the first to ToDo
        todos.unshift(...wip)
        wip.length = 0
      }

      // Add new tasks at the specified index
      const index = util.clamp(args.index ?? group.length, 0, group.length)
      group.splice(index, 0, ...texts)
      if (env.AUTO_WIP && !wip.length && todos[0] && todos[0] !== texts[0]) {
        // Move first ToDo to WIP
        wip.push(todos.shift()!)
      }
      storage.save(source.path, state)
      // Re-load metadata after state changes
      meta = metadata.load(source.id)
      return getSummary(source.id, { tasks: _.compact(texts.map(t => meta.tasksByIdOrText[t])) })
    },
  }),

  update: defineTool('update', {
    schema: z.object({
      source_id: schemas.sourceId,
      ids: schemas.ids,
      status: z.union([schemas.status, z.literal(env.STATUS_DELETED)]).describe(util.trimLines(`
        ${schemas.status.description}
        - "${env.STATUS_DELETED}" when they want these removed
        ${env.AUTO_WIP ? `- Updating tasks to ${env.STATUS_WIP} moves others to ${env.STATUS_TODO}, finishing a ${env.STATUS_WIP} task moves the first ${env.STATUS_DONE} to ${env.STATUS_WIP}` : ''}
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

  summary: defineTool('summary', {
    schema: z.object({
      source_id: schemas.sourceId,
    }),
    description: 'Get count of tasks in each status and the work-in-progress tasks',
    isReadOnly: true,
    handler: (args) => {
      return getSummary(args.source_id)
    },
  }),

  debug: defineTool('debug', {
    schema: z.object({}),
    description: util.trimLines(`
      Get debug information about the MCP server and context
      - ${pkg.name} is at version ${pkg.version}
    `),
    isReadOnly: true,
    isEnabled: env.DEBUG,
    handler: (args, context) => {
      return {
        ...args, processEnv: process.env, argv: process.argv,
        env, context, version: pkg.version, cwd: util.CWD,
      }
    },
  }),
} as const satisfies Record<string, Tool>

function getSummary(sourceId?: string, extra?: object) {
  const meta = metadata.load(sourceId)
  const counts = _.mapValues(meta.groups, tasks => tasks.length)
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  return JSON.stringify({
    source: _.omit(meta.source, ['workspace']),
    ...counts,
    total,
    instructions: env.INSTRUCTIONS || undefined,
    wip: meta.groups[env.STATUS_WIP],
    ...extra,
  })
}

function defineTool<S extends ZodSchema>(name: string, tool: {
  schema: S
  description: string
  isResource?: boolean
  isReadOnly?: boolean
  isEnabled?: boolean
  handler: (args: z.infer<S>, context?: any) => any
}) {
  const toolName = env.PREFIX_TOOLS ? `tasks_${name}` : name
  return {
    ...tool,
    name: toolName,
    isResource: tool.isResource ?? false,
    isReadOnly: tool.isReadOnly ?? false,
    isEnabled: tool.isEnabled ?? true,
  }
}

export default tools
export type { Tool }
