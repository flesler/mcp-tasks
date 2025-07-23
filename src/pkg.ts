import fs from 'fs'
import util from './util.js'

const pkg = JSON.parse(fs.readFileSync(
  util.resolve('package.json'), 'utf8',
))

export default {
  ...pkg,
  name: pkg.name as string,
  version: pkg.version as `${number}.${number}.${number}`,
  author: pkg.homepage?.split('/')[3] || 'unknown',
}
