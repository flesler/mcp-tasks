import { FastMCP } from 'fastmcp'
import env from './env.js'
import logger from './logger.js'
import pkg from './pkg.js'
import tools from './tools.js'

const server = new FastMCP({
  name: `${pkg.author}/${pkg.name}`,
  version: pkg.version,
})

// Register all tools & resources
for (const tool of Object.values(tools)) {
  if (!tool.isEnabled) {
    continue
  }
  if (tool.isResource) {
    // Register as resource
    server.addResource({
      uri: `resource://${tool.name}`,
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
        title: tool.name,
      },
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
      execute: (args, context) => {
        try {
          const result = tool.handler(args as any, context)
          return Promise.resolve(enforceString(result))
        } catch (err) {
          logger.error(err)
          return Promise.reject(err)
        }
      },
    })
  }
}

if (env.TRANSPORT === 'http') {
  await server.start({
    transportType: 'httpStream',
    httpStream: {
      port: env.PORT,
    },
  })
} else {
  await server.start({
    transportType: 'stdio',
  })
}

logger.log(`Started new server on ${env.TRANSPORT} mode`)

function enforceString(value: any): string {
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

export default server
