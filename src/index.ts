#!/usr/bin/env node
import cli from './cli.js'
import pkg from './pkg.js'

const args = process.argv.slice(2)
const cmd = pkg.name

if (args.includes('--help') || args.includes('-h')) {
  console.log(`${pkg.author}/${cmd} ${pkg.version}
${pkg.description}

Server Usage:
  ${cmd}                    # Run MCP server with stdio transport
  TRANSPORT=http ${cmd}      # Run MCP server with HTTP transport

CLI Usage:
  ${cmd} setup <file-path>                    # Setup a task file
  ${cmd} add <text> [status]      # Add a task
  ${cmd} search [terms...]        # Search tasks
  ${cmd} update <task-id> <status> # Update task status
  ${cmd} summary <source-id>                  # Get task summary

Examples:
  ${cmd} setup /home/user/tasks.md
  ${cmd} add "Implement login" "To Do"
  ${cmd} search auth login
  ${cmd} update m3Qw,p9Lx "Done"
  ${cmd} summary
`)
  process.exit(0)
}

if (cli.isCommand(args[0])) {
  // Run CLI command
  cli.run(args)
} else {
  // Start the MCP server
  await import('./server.js')

  // Keep the process alive for stdio transport
  process.stdin.resume()
}
