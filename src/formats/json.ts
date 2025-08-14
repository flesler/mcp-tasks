import type { FormatParser } from '../types.js'
import util from '../util.js'

const json: FormatParser = {
  read(path) {
    const content = util.readFile(path, '{}').trim()
    return JSON.parse(content)
  },

  write(path, state) {
    const content = JSON.stringify(state, null, '\t')
    util.writeFile(path, content)
  },
}

export default json
