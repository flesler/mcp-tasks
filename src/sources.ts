import { isAbsolute } from 'path'
import env from './env.js'
import { Source } from './types.js'
import util from './util.js'

const sources = {
  load(): string[] {
    try {
      const content = util.readFile(env.SOURCES_PATH, '[]')
      return JSON.parse(content)
    } catch {
      return []
    }
  },

  register(path: string): Source {
    if (!util.isFile(path) || !isAbsolute(path)) {
      throw new Error(`Must be an absolute path to a file: ${path}. Call again with an absolute path.`)
    }
    const paths = sources.load()
    // Remove if exists and add to front (LIFO)
    const filtered = paths.filter(p => p !== path)
    util.writeFile(env.SOURCES_PATH, JSON.stringify([path, ...filtered]))
    return sources.fromPath(path)
  },

  require(id?: string): Source {
    const paths = sources.load()
    const srcs = paths.map(sources.fromPath)
    const src = id ? srcs.find(src => src.id === id) : srcs[0]
    if (!src) {
      throw new Error(`Source not found for ID: ${id || '<none>'}`)
    }
    return src
  },

  fromPath(path: string): Source {
    return { id: util.generateId(path), path }
  },
}

export default sources
