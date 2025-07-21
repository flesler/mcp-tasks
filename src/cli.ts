import { ZodError } from 'zod'
import env from './env.js'
import tools from './tools.js'

type Tools = typeof tools
type ToolName = keyof Tools

// Type-safe mapping from tool names to CLI argument parsers
type ToolMapper = {
  [K in ToolName]: (args: string[]) => Parameters<Tools[K]['handler']>[0]
}

const commands: ToolMapper = {
  setup: ([sourcePath, workspace]) => ({ source_path: sourcePath, workspace: workspace || undefined }),
  search: ([statuses = '', terms = '']) => ({ statuses: split(statuses), terms: split(terms) }),
  add: ([text, status = env.STATUS_TODO]) => ({ texts: [text], status }),
  update: ([taskIds, status]) => ({ ids: split(taskIds) || [], status }),
  summary: () => ({}),
  debug: () => ({}),
}

const cli = {
  isCommand: (arg: string) => arg in commands,

  run(args: string[]) {
    try {
      const cmd = args.shift() as ToolName
      let toolArgs: any = commands[cmd](args)
      toolArgs = tools[cmd].schema.parse(toolArgs)
      const res = tools[cmd].handler(toolArgs)
      console.log(res)
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        console.error(`Error: ${issues}`)
        process.exit(1)
      }
      throw err
    }
  },
}

function split(str: string): string[] | undefined {
  return str.length > 0 ? str.split(/\s*,\s*/).filter(Boolean) : undefined
}

export default cli
