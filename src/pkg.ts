import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packagePath = join(__dirname, '..', 'package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))

export default {
  name: pkg.name as string,
  version: pkg.version as `${number}.${number}.${number}`,
  description: pkg.description as string,
}
