import pkg from './pkg.js'

const env = {
  PORT: readNumber('PORT', 4680),
  PREFIX_TOOLS: readBoolean('PREFIX_TOOLS', true),
  TRANSPORT: readString('TRANSPORT', 'stdio'),
  STATUS_WIP: readString('STATUS_WIP', 'In Progress'),
  STATUS_TODO: readString('STATUS_TODO', 'To Do'),
  STATUS_DONE: readString('STATUS_DONE', 'Done'),
  STATUS_NOTES: readString('STATUS_NOTES', 'Notes'),
  // Not configurable
  STATUS_DELETED: 'Deleted',
  STATUSES: readStrings('STATUSES', 'Backlog'),
  AUTO_WIP: readBoolean('AUTO_WIP', true),
  INSTRUCTIONS: readString('INSTRUCTIONS', `Use ${pkg.name} tools when the user mentions new or updated tasks`),
  KEEP_DELETED: readBoolean('KEEP_DELETED', false),
  DEBUG: readBoolean('DEBUG', false),
  SOURCES_PATH: readString('SOURCES_PATH', './sources.json'),
}

const { STATUSES } = env
// Augment if not explicitly set
if (!STATUSES.includes(env.STATUS_TODO)) {
  STATUSES.unshift(env.STATUS_TODO)
}
if (!STATUSES.includes(env.STATUS_WIP)) {
  STATUSES.unshift(env.STATUS_WIP)
}
if (!STATUSES.includes(env.STATUS_DONE)) {
  STATUSES.push(env.STATUS_DONE)
}
if (env.STATUS_NOTES && !STATUSES.includes(env.STATUS_NOTES)) {
  STATUSES.push(env.STATUS_NOTES)
}
if (env.KEEP_DELETED && !STATUSES.includes(env.STATUS_DELETED)) {
  STATUSES.push(env.STATUS_DELETED)
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
