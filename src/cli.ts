import { ZodError } from 'zod'
import tools, { Tool } from './tools.js'

type Tools = typeof tools
type ToolName = keyof Tools

const cli = {
  isCommand: (arg: string) => arg in tools,

  async run(args: string[]) {
    try {
      const cmd = args.shift() as ToolName
      const tool = tools[cmd]
      const res = await cli.runTool(tool, tool.fromArgs(args))
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

  async runTool(tool: Tool, args: any): Promise<string> {
    try {
      const validatedArgs = tool.schema.parse(args)
      const result = tool.handler(validatedArgs)
      return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (err) {
      throw err
    }
  },
}

export default cli
