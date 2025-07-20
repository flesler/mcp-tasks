import * as YAML from 'yaml'
import { FormatParser } from '../types.js'
import util from '../util.js'

const yml: FormatParser = {
  read(path) {
    const content = util.readFile(path, '').trim()
    return YAML.parse(content)
  },

  write(path, state) {
    const content = YAML.stringify(state)
    util.writeFile(path, content)
  },
}

export default yml
