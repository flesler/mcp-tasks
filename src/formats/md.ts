import _ from 'lodash'
import { basename } from 'path'
import env from '../env.js'
import { FormatParser, State } from '../types.js'
import util from '../util.js'

const md: FormatParser = {
  read(path) {
    const content = util.readFile(path)
    const lines = content.split('\n')
    const state: State = { groups: {} }

    let currentGroup = ''
    for (const line of lines.map(line => line.trim())) {
      if (line.startsWith('## ')) {
        const group = line.substring(3).trim()
        if (group) {
          currentGroup = group
        }
      } else if (line.startsWith('- ') && currentGroup) {
        const text = line.substring(2).replace(/^\[[x\-\s]\]\s*/, '').trim()
        if (text) {
          if (!state.groups[currentGroup]) {
            state.groups[currentGroup] = []
          }
          state.groups[currentGroup].push(text)
        }
      }
    }
    return state
  },

  write(path, state) {
    const title = _.startCase(basename(path, '.md'))
    let content = `# Tasks - ${title}\n\n`

    for (const group of util.keysOf(state.groups)) {
      content += `## ${group}\n\n`
      const tasks = state.groups[group] || []
      if (tasks.length) {
        for (const task of tasks) {
          const checkbox = group === env.STATUS_DONE ? '[x]' : '[ ]'
          content += `- ${checkbox} ${task}\n`
        }
      }
      content += '\n'
    }

    util.writeFile(path, `${content.trim()}\n`)
  },
}

export default md
