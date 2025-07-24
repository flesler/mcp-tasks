import _ from 'lodash'
import { basename } from 'path'
import env from '../env.js'
import { FormatParser, State } from '../types.js'
import util from '../util.js'

const PREFIX = '## '
const LINE_REGEX: RegExp = /^ *- *(?:\[.?\])? *(.+) *$/

// TODO: Make this configurable (?)
const SKIP_IF_EMPTY: string[] = _.compact([env.STATUS_DELETED, env.STATUS_NOTES, env.STATUS_REMINDERS])

const md: FormatParser = {
  read(path) {
    const content = util.readFile(path)
    const lines = _.compact(content.split('\n').map(line => line.trim()))
    const state: State = { groups: {} }

    let currentGroup = env.STATUS_TODO
    for (const line of lines) {
      if (line.startsWith(PREFIX)) {
        const group = line.substring(PREFIX.length).trim()
        if (group) {
          currentGroup = group
        }
      } else {
        const text = line.match(LINE_REGEX)?.[1]?.trim()
        if (text) {
          if (!state.groups[currentGroup]) {
            state.groups[currentGroup] = []
          }
          const unescaped = text.replace(/\\n/g, '\n')
          state.groups[currentGroup].push(unescaped)
        }
      }
    }
    return state
  },

  write(path, state) {
    const title = _.startCase(basename(path, '.md'))
    let content = `# Tasks - ${title}\n\n`

    for (const group of util.keysOf(state.groups)) {
      const tasks = state.groups[group] || []
      if (!tasks.length && (SKIP_IF_EMPTY.includes(group) || !env.STATUSES.includes(group))) {
        continue
      }
      content += `${PREFIX}${group}\n\n`
      for (const task of tasks) {
        const char = group === env.STATUS_DONE ? 'x' :
          group === env.STATUS_NOTES || group === env.STATUS_REMINDERS ? '' : ' '
        const block = char ? `[${char}] ` : ''
        const escaped = task.replace(/\r?\n/g, '\\n')
        content += `- ${block}${escaped}\n`
      }
      content += '\n'
    }
    util.writeFile(path, `${content.trim()}\n`)
  },
}

export default md
