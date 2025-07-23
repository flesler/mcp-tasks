import cli from './cli.js'
import pkg from './pkg.js'
import server from './server.js'

const args = process.argv.slice(2)
if (args.length === 0) {
  await server.start()
} else if (cli.isCommand(args[0])) {
  // Run CLI command
  await cli.run(args)
} else if (args[0] === '--check') {
  process.exit(0)
} else {
  const cmd = pkg.name
  console.log(`${pkg.author}/${cmd} ${pkg.version}
${pkg.description}

Server Usage:
  ${cmd}                    # Run MCP server with stdio transport
  TRANSPORT=http ${cmd}      # Run MCP server with HTTP transport

CLI Usage:
  ${cmd} setup <file-path> [workspace]        # Setup a task file
  ${cmd} add <text> [status] [index]          # Add a task
  ${cmd} search [statuses] [terms]            # Search tasks
  ${cmd} update <task-ids> <status>           # Update task status
  ${cmd} summary                              # Get task summary

Examples:
  ${cmd} setup tasks.md /home/user/project
  ${cmd} add "Implement login" "To Do" 0
  ${cmd} search "To Do,Done" "auth,login"
  ${cmd} update m3Qw,p9Lx "Done"
  ${cmd} summary
`)
  process.exit(0)
}
