import _ from 'lodash'
import { isAbsolute, resolve } from 'path'
import env from './env.js'
import { Source, SourceRaw } from './types.js'
import util from './util.js'

const SOURCES_PATH = util.resolve(env.SOURCES_PATH)
// If it's equal to HOME, it's not a valid workspace
const CWD = util.CWD === process.env.HOME ? '' : util.CWD

const sources = {
  raw(): SourceRaw[] {
    try {
      const content = util.readFile(SOURCES_PATH, '[]')
      const data: SourceRaw[] = JSON.parse(content)
      // Filter out non-objects (legacy format)
      return data.filter(_.isObject)
    } catch {
      return []
    }
  },

  load(): Source[] {
    return sources.raw().map(sources.fromRaw)
  },

  register(sourcePath: string, workspace = CWD): Source {
    let path = sourcePath
    if (!isAbsolute(path)) {
      if (!workspace) {
        throw new Error('You must specify a workspace directory when registering a relative path.')
      }
      path = resolve(workspace, path)
    }
    const list = sources.raw()
    // Remove if exists and add to front (LIFO)
    const filtered = list.filter(s => s.path !== path)
    const source: SourceRaw = { path, workspace }
    util.writeFile(SOURCES_PATH, JSON.stringify([source, ...filtered]))
    return sources.fromRaw(source)
  },

  require(id?: string, workspace = CWD): Source {
    const list = sources.load()
    const msg = 'You must request a file path from the user, make it absolute and call tasks_setup.'
    if (id) {
      const src = list.find(src => src.id === id)
      if (!src) {
        throw new Error(`Source "${id}" not found. ${msg}`)
      }
      return src
    }
    // Default to the workspace's most recent
    const src = list.find(s => s.workspace === workspace) || list[0]
    if (!src) {
      throw new Error(msg)
    }
    return src
  },

  fromRaw(raw: SourceRaw): Source {
    return { ...raw, id: util.generateId(raw.path) }
  },
}

export default sources
