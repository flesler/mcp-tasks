#!/usr/bin/env node
import pkg from './pkg.js'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`${pkg.author}/${pkg.name} ${pkg.version}
${pkg.description}

Examples:
  ${pkg.name}                    # Run with stdio transport
  TRANSPORT=http ${pkg.name}      # Run with HTTP transport
`)
  process.exit(0)
}

// Start the MCP server
import './server.js'

// Keep the process alive for stdio transport
process.stdin.resume()
