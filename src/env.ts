const env = {
  PORT: readNumber('PORT', 4680),
  PREFIX_TOOLS: readBoolean('PREFIX_TOOLS', true),
  TRANSPORT: readString('TRANSPORT', 'stdio'),
  SOURCES_PATH: readString('SOURCES_PATH', './sources.json'),
  STATUS_WIP: readString('STATUS_WIP', 'In Progress'),
  STATUS_TODO: readString('STATUS_TODO', 'To Do'),
  STATUS_DONE: readString('STATUS_DONE', 'Done'),
  STATUSES: readStrings('STATUSES', 'Backlog'),
  AUTO_WIP: readBoolean('AUTO_WIP', true),
  INSTRUCTIONS: readString('INSTRUCTIONS', ''),
} as const

// Augment if not explicitly set
if (!env.STATUSES.includes(env.STATUS_TODO)) {
  env.STATUSES.unshift(env.STATUS_TODO)
}
if (!env.STATUSES.includes(env.STATUS_WIP)) {
  env.STATUSES.unshift(env.STATUS_WIP)
}
if (!env.STATUSES.includes(env.STATUS_DONE)) {
  env.STATUSES.push(env.STATUS_DONE)
}

function readString(key: string, def: any): string {
  return process.env[key] ?? String(def)
}

function readNumber(key: string, def: number): number {
  return Number.parseFloat(readString(key, def))
}

function readBoolean(key: string, def: boolean): boolean {
  return readString(key, def) === 'true'
}

function readStrings(key: string, def: string): string[] {
  return readString(key, def).split(/\s*,\s*/).filter(Boolean)
}

export default env
