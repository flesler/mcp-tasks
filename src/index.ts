#!/usr/bin/env node
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`MCP Tasks Server
Examples:
  mcp-tasks                    # Run with stdio transport
  TRANSPORT=http mcp-tasks      # Run with HTTP transport
`)
  process.exit(0)
}

// Start the MCP server
import './server.js'

// Keep the process alive for stdio transport
process.stdin.resume()
