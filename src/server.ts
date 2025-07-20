import { FastMCP } from 'fastmcp'
import env from './env.js'
import pkg from './pkg.js'
import tools from './tools.js'

const server = new FastMCP({
  name: `${pkg.author}/${pkg.name}`,
  version: pkg.version,
})

// Register all tools & resources
for (const [name, tool] of Object.entries(tools)) {
  // Conditionally prefix tool names based on env var
  const toolName = env.PREFIX_TOOLS ? `tasks_${name}` : name

  if (tool.isResource) {
    // Register as resource
    server.addResource({
      uri: `resource://${toolName}`,
      name: tool.description,
      mimeType: 'text/plain',
      load() {
        const result = tool.handler({} as any)
        return Promise.resolve({ text: enforceString(result) })
      },
    })
  } else {
    // Register as tool with enhanced logging
    server.addTool({
      annotations: {
        openWorldHint: false, // This tool doesn't interact with external systems
        readOnlyHint: tool.isReadOnly,
        title: toolName,
      },
      name: toolName,
      description: tool.description,
      parameters: tool.schema,
      execute: (args, _context) => {
        try {
          const result = tool.handler(args as any)
          return Promise.resolve(enforceString(result))
        } catch (err) {
          console.error(err)
          return Promise.reject(err)
        }
      },
    })
  }
}

if (env.TRANSPORT === 'http') {
  server.start({
    transportType: 'httpStream',
    httpStream: {
      port: env.PORT,
    },
  })
} else {
  server.start({
    transportType: 'stdio',
  })
}

function enforceString(value: any): string {
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

export default server
