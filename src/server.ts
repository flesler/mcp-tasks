import { FastMCP } from 'fastmcp'

import cli from './cli.js'
import env from './env.js'
import logger from './logger.js'
import pkg from './pkg.js'
import tools from './tools.js'

async function start() {
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
        load: () => cli.runTool(tool, []).then(text => ({ text })),
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
        execute: (args) => cli.runTool(tool, args),
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

    logger.log('Started new server', { transport: env.TRANSPORT })
  }
}

export default { start }
