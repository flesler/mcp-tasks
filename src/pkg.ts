import type { PackageJson } from 'types-package-json'
import util from './util.js'

const pkgPath = util.resolve('package.json', util.REPO)
const { default: pkg } = await import(pkgPath, { with: { type: 'json' } }) as { default: Partial<PackageJson> }

export default {
  ...pkg,
  version: pkg.version as `${number}.${number}.${number}`,
  author: pkg.homepage?.split('/')[3] || 'unknown',
}
