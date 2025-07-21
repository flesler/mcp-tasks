# MCP Tasks 📋

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=mcp-tasks&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwbWNwLXRhc2tzJTIyJTdE)
[![npm version](https://img.shields.io/npm/v/mcp-tasks.svg)](https://www.npmjs.com/package/mcp-tasks)
[![Node.js](https://img.shields.io/node/v/mcp-tasks.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/docker/v/flesler/mcp-tasks?label=docker)](https://hub.docker.com/r/flesler/mcp-tasks)

A comprehensive and **efficient Model Context Protocol (MCP) server** for task management that works seamlessly with Claude, Cursor, and other MCP clients. Designed to minimize tool confusion and maximize LLM budget efficiency while providing powerful search, filtering, and organization capabilities across multiple file formats.

## ✨ **Features**

- ⚡ **Ultra-efficient design**: Minimal tool count (5 tools) to reduce AI confusion
- 🎯 **Budget-optimized**: Batch operations, smart defaults and auto-operations minimize LLM API calls
- 🚀 **Multi-format support**: Markdown (`.md`), JSON (`.json`), and YAML (`.yml`) task files
- 🔍 **Powerful search**: Case-insensitive text/status filtering with OR logic, and ID-based lookup
- 📊 **Smart organization**: Status-based filtering with customizable workflow states
- 🎯 **Position-based indexing**: Easy task ordering with 0-based insertion
- 📁 **Multi-source support**: Manage multiple task files simultaneously
- 🔄 **Real-time updates**: Changes persist automatically to your chosen format
- 🤖 **Auto WIP management**: Automatically manages work-in-progress task limits
- 🚫 **Duplicate prevention**: Automatically prevents duplicate tasks
- 🛡️ **Type-safe**: Full TypeScript support with Zod validation
- 🔒 **Ultra-safe**: AI has no way to rewrite or delete your tasks (unless you enable it), only add and move them

## 🚀 **Quick Start**

### Option 1: NPX (Recommended)
```bash
# Add to your MCP client config:
{
  "mcpServers": {
    "mcp-tasks": {
      "command": "npx",
      "args": ["-y", "mcp-tasks"]
    }
  }
}
```

### Option 2: Docker
```bash
# Add to your MCP client config:
{
  "mcpServers": {
    "mcp-tasks": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "flesler/mcp-tasks"
      ]
    }
  }
}
```

## 🤖 **AI Integration Tips**

To encourage the AI to use these tools, you can start with a prompt like the following, with any path you want with .md (recommended), .json, .yml:

```
Use mcp-tasks tools to track our work in path/to/tasks.md
```

If you are telling it about new or updated tasks, you can append this to the end of your prompt:

```
use mcp-tasks
```

**Adding tasks while AI works:** To safely add tasks without interfering with AI operations, [use the CLI](#-cli-usage) from a separate terminal:

```bash
npx mcp-tasks add "Your new task text" "To Do" 0
```


## 🔧 **Installation Examples**

### Cursor (`~/.cursor/mcp.json`)

**Basic configuration (recommended):**
```json
{
  "mcpServers": {
    "mcp-tasks": {
      "command": "npx",
      "args": ["-y", "mcp-tasks"]
    }
  }
}
```

**Full configuration with custom environment:**
```json
{
  "mcpServers": {
    "mcp-tasks": {
      "command": "npx",
      "args": ["-y", "mcp-tasks"],
      "env": {
        "STATUS_WIP": "In Progress",
        "STATUS_TODO": "To Do",
        "STATUS_DONE": "Done",
        "STATUS_NOTES": "Notes",
        "STATUSES": "In Progress,To Do,Done,Backlog",
        "AUTO_WIP": "true",
        "PREFIX_TOOLS": "true",
        "KEEP_DELETED": "true",
        "TRANSPORT": "stdio",
        "PORT": "4680",
        "INSTRUCTIONS": "Use mcp-tasks tools when the user mentions new or updated tasks"
      }
    }
  }
}
```

**HTTP transport for remote access:**
```json
{
  "mcpServers": {
    "mcp-tasks": {
      "command": "npx",
      "args": ["-y", "mcp-tasks"],
      "env": {
        "TRANSPORT": "http",
        "PORT": "4680"
      }
    }
  }
}
```

### Claude Desktop (`~/.config/claude_desktop_config.json`)

**Basic setup:**
```json
{
  "mcpServers": {
    "mcp-tasks": {
      "command": "npx",
      "args": ["-y", "mcp-tasks"]
    }
  }
}
```

## 📁 **Supported File Formats**

| Extension | Format | Best For | Auto-Created |
|-----------|--------|----------|--------------|
| `.md` | Markdown | Human-readable task lists | ✅ |
| `.json` | JSON | Structured data, APIs | ✅ |
| `.yml` | YAML | Configuration files | ✅ |

**Format is auto-detected from file extension.** All formats support the same features and can be mixed in the same project.

**Recommended**: Markdown (`.md`) for human readability and editing

**⚠️ Warning**: Start with a new file rather than using pre-existing task files to avoid losing non-task content.

## 🛠️ **Available Tools**

When `PREFIX_TOOLS=true` (default), all tools are prefixed with `tasks_`:

| Tool | Description | Parameters |
|------|-------------|------------|
| `tasks_setup` | Initialize a task file (creates if missing, supports `.md`, `.json`, `.yml`) | `source_path`, `workspace?` |
| `tasks_search` | Search tasks with filtering | `source_id`, `statuses?`, `terms?`, `ids?` |
| `tasks_add` | Add new tasks to a status | `source_id`, `texts[]`, `status`, `index?` |
| `tasks_update` | Update tasks by ID | `source_id`, `ids[]`, `status`, `index?` |
| `tasks_summary` | Get task counts and work-in-progress | `source_id` |

**ID Format**: Both `source_id` (from file path) and task `id` (from task text) are 4-character alphanumeric strings (e.g., `"xK8p"`, `"m3Qw"`).

### Tool Examples

**Setup a task file:**
```javascript
tasks_setup({
  workspace: "/path/to/project",
  source_path: "tasks.md"  // relative to workspace or absolute
  // source_path: "tasks.json"
  // source_path: "tasks.yml"
})
// Returns: {"source":{"id":"xK8p","path":"/path/to/project/tasks.md"},"Backlog":0,"To Do":0,"In Progress":0,"Done":0,"inProgress":[]}
// Source ID (4-char alphanumeric) is used for all subsequent operations
```

**Add tasks:**
```javascript
tasks_add({
  source_id: "xK8p", // From setup response
  texts: ["Implement authentication", "Write tests"],
  status: "To Do",
  index: 0  // Add at top (optional)
})
// Returns: {"source":{"id":"xK8p","path":"/absolute/path/to/tasks.md"},"Backlog":0,"To Do":2,"In Progress":0,"Done":0,"inProgress":[],"tasks":[{"id":"m3Qw","text":"Implement authentication","status":"To Do","index":0},{"id":"p9Lx","text":"Write tests","status":"To Do","index":1}]}
```

**Search and filter:**
```javascript
tasks_search({
  source_id: "xK8p",        // From setup response
  terms: ["auth", "deploy"],          // Search terms (text or status, OR logic)
  statuses: ["To Do"],      // Filter by status
  ids: ["m3Qw", "p9Lx"]     // Filter by specific task IDs
})
// Returns: [{"id":"m3Qw","text":"Implement authentication","status":"To Do","index":0}]
```

**Update tasks status:**
```javascript
tasks_update({
  source_id: "xK8p",        // From setup response
  ids: ["m3Qw", "p9Lx"],    // Task IDs from add/search responses
  status: "Done"            // Use "Deleted" to remove
})
// Returns: {"source":{"id":"xK8p","path":"/absolute/path/to/tasks.md"},"Backlog":0,"To Do":0,"In Progress":0,"Done":2,"inProgress":[],"tasks":[{"id":"m3Qw","text":"Implement authentication","status":"Done","index":0},{"id":"p9Lx","text":"Write tests","status":"Done","index":1}]}
```

**Get overview:**
```javascript
tasks_summary({
  source_id: "xK8p"         // From setup response
})
// Returns: {"source":{"id":"xK8p","path":"/absolute/path/to/tasks.md"},"Backlog":0,"To Do":0,"In Progress":1,"Done":2,"inProgress":[{"id":"r7Km","text":"Fix critical bug","status":"In Progress","index":0}]}
```

## 🎛️ **Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `4680` | HTTP server port (when `TRANSPORT=http`) |
| `PREFIX_TOOLS` | `true` | Prefix tool names with `tasks_` |
| `STATUS_WIP` | `In Progress` | Work-in-progress status name |
| `STATUS_TODO` | `To Do` | ToDo status name |
| `STATUS_DONE` | `Done` | Completed status name |
| `STATUS_NOTES` | `Notes` | Optional notes/non-actionable status name |
| `STATUSES` | `Backlog` | Comma-separated additional statuses |
| `AUTO_WIP` | `true` | One WIP moves rest to To Do, first To Do to WIP when no WIP's |
| `KEEP_DELETED` | `true` | Retain deleted tasks (AI can't lose you tasks!) |
| `INSTRUCTIONS` | `...` | Included in all tool responses, for the AI to follow |
| `SOURCES_PATH` | `./sources.json` | File to store source registry (internal) |
| `DEBUG` | `false` | if true, enable the `tasks_debug` tool |

### Advanced Configuration Examples

Optional, the WIP/ToDo/Done statuses can be included to control their order.

**Custom workflow statuses:**
```json
{
  "env": {
    "STATUSES": "WIP,Pending,Archived,Done,To Review",
    "STATUS_WIP": "WIP",
    "STATUS_TODO": "Pending",
    "AUTO_WIP": "false"
  }
}
```

## 📊 **File Formats**

### Markdown (`.md`) - Human-Readable
```markdown
# Tasks - File Name

## In Progress
- [ ] Write user registration

## To Do
- [ ] Implement authentication
- [ ] Set up CI/CD pipeline

## Backlog
- [ ] Plan architecture
- [ ] Design database schema

## Done
- [x] Set up project structure
- [x] Initialize repository
```

### JSON (`.json`) - Structured Data
```json
{
  "groups": {
    "In Progress": [
      "Write user registration"
    ],
    "To Do": [
      "Implement authentication",
      "Set up CI/CD pipeline"
    ],
    "Backlog": [
      "Plan architecture",
      "Design database schema"
    ],
    "Done": [
      "Set up project structure",
      "Initialize repository"
    ]
  }
}
```

### YAML (`.yml`) - Configuration-Friendly
```yaml
groups:
  "In Progress":
    - Write user registration
  "To Do":
    - Implement authentication
    - Set up CI/CD pipeline
  Backlog:
    - Plan architecture
    - Design database schema
  Done:
    - Set up project structure
    - Initialize repository
```

## 🚀 **CLI Usage**

```bash
# Show help
mcp-tasks --help

# Default: stdio transport
mcp-tasks

# HTTP transport
TRANSPORT=http mcp-tasks
TRANSPORT=http PORT=8080 mcp-tasks

# Custom configuration
STATUS_WIP="Working" AUTO_WIP=false mcp-tasks
```

## 💻 **CLI Usage**

You can also use `mcp-tasks` as a command-line tool for quick task management:

```bash
# Setup a task file
mcp-tasks setup path/to/tasks.md $PWD

# Add tasks
mcp-tasks add "Implement authentication"           # Defaults to "To Do" status
mcp-tasks add "Write tests" "Backlog"              # Add with specific status

# Search tasks
mcp-tasks search                              # All tasks
mcp-tasks search "" "auth,login"              # Search for specific terms
mcp-tasks search "To Do,Done" ""              # Filter by statuses
mcp-tasks search "In Progress" "bug"          # Filter by status and search terms

# Update task status (comma-separated IDs)
mcp-tasks update m3Qw,p9Lx Done

# Get summary
mcp-tasks summary
```

**CLI Features:**
- Direct access to all MCP tool functionality
- JSON output for easy parsing and scripting
- Same reliability and duplicate prevention as MCP tools
- Perfect for automation scripts and CI/CD pipelines

## 🧪 **Development**

```bash
# Clone and setup
git clone https://github.com/flesler/mcp-tasks
cd mcp-tasks
npm install

# Development mode (auto-restart)
npm run dev              # STDIO transport
npm run dev:http         # HTTP transport on port 4680

# Build and test
npm run build           # Compile TypeScript
npm run lint            # Check code style
npm run lint:full       # Build + lint
```

## 🛠️ **Troubleshooting**

### **Requirements**
- **Node.js ≥20** - This package requires Node.js version 20 or higher

### **Common Issues**

**Where are my tasks stored?**
- Tasks are stored in the file path you specified by the AI in `tasks_setup`
- The absolute path is returned in every tool call response under `source.path`
- If you forgot the location, check any tool response or ask the AI to show it to you

**Lost content in Markdown files:**
- ⚠️ The tools will rewrite the entire file, preserving only tasks under recognized status sections
- Non-task content (notes, documentation) may be lost when tools modify the file
- Use a dedicated task file rather than mixing tasks with other content

## Why not just have AI edit the task files directly?

- **File parsing complexity:** AI must read entire files, parse markdown structure, and understand current state - expensive and error-prone
- **Multi-step operations:** Moving a task from "In Progress" to "Done" requires multiple `read_file`, `grep_search`, `sed` calls to locate and modify correct sections
- **Context loss:** Large task files forcing AI to work with incomplete chunks due to token restrictions and lose track of overall structure
- **State comprehension:** AI struggles to understand true project state when reading fragmented file sections - which tasks are actually in progress?
- **Edit precision:** Manual editing risks corrupting markdown formatting, losing tasks, or accidentally modifying the wrong sections
- **Concurrent editing conflicts:** When AI directly edits files, humans can't safely make manual changes without creating conflicts or overwrites
- **Token inefficiency:** Reading+parsing+editing cycles consume far more tokens than structured tool calls with clear inputs/outputs
- **Safety:** AI can accidentally change or delete tasks when directly editing files, but with these tools it cannot rewrite or delete your tasks

## 🤝 **Contributing**

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Run: `npm run lint:full`
5. Submit a pull request

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 **Links**

- 📦 **[NPM Package](https://www.npmjs.com/package/mcp-tasks)**
- 🐙 **[GitHub Repository](https://github.com/flesler/mcp-tasks)**
- 🐛 **[Report Issues](https://github.com/flesler/mcp-tasks/issues)**
- 📚 **[MCP Specification](https://modelcontextprotocol.io/)**
- ⚡ **[FastMCP Framework](https://github.com/punkpeye/fastmcp)**
