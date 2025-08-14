import env from './env.js'
import json from './formats/json.js'
import md from './formats/md.js'
import yml from './formats/yml.js'
import type { FormatParser, State } from './types.js'
import util from './util.js'

const PARSERS: Record<string, FormatParser> = {
  md,
  json,
  yml,
}

const storage = {
  load(path: string): State {
    const empty = storage.emptyState()
    if (!util.exists(path)) {
      return storage.save(path, empty)
    }
    try {
      const state = storage.getParser(path).read(path)
      if (!env.KEEP_DELETED) {
        // In case it was switched off after
        delete state.groups[env.STATUS_DELETED]
      }
      return { ...empty, groups: { ...empty.groups, ...state.groups } }
    } catch {
      return empty
    }
  },

  save(path: string, state: State): State {
    storage.getParser(path).write(path, state)
    return state
  },

  /** Get the appropriate parser based on file extension */
  getParser(path: string): FormatParser {
    const extension = util.ext(path)
    const parser = PARSERS[extension]
    if (!parser) {
      const exts = storage.supportedExtensions().join(', ')
      throw new Error(`Unsupported file extension: ${extension}. Use one of: ${exts}`)
    }
    return parser
  },

  supportedExtensions: () => Object.keys(PARSERS),

  emptyState(): State {
    const groups: Record<string, string[]> = {}
    for (const status of env.STATUSES) {
      groups[status] = []
    }
    return { groups }
  },
}

export default storage
