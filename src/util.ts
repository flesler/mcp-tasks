import crypto from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import _ from 'lodash'
import { dirname } from 'path'

/** Object.keys() with more accurate types */
export type KeysOf<T> = Array<keyof T>

const ID_LENGTH = 4

const util = {
  readFile(path: string, def?: string): string {
    if (!util.exists(path)) {
      return def || ''
    }
    return readFileSync(path, 'utf-8')
  },

  writeFile(path: string, content: string): void {
    util.mkdirp(dirname(path))
    writeFileSync(path, content, 'utf-8')
  },

  mkdirp(path: string): void {
    if (!util.exists(path)) {
      mkdirSync(path, { recursive: true })
    }
  },

  ext(path: string): string {
    const match = path.match(/\.(\w{2,5})$/)
    return match ? match[1] : ''
  },

  isFile(path: string): boolean {
    return !!util.ext(path)
  },

  exists(path: string): boolean {
    return existsSync(path)
  },

  generateId(text: string): string {
    const hash = crypto.createHash('md5').update(text).digest('base64url')
    return hash.replace(/\W+/, '').slice(-ID_LENGTH)
  },

  isId(id: string): boolean {
    return id.length === ID_LENGTH && /^\w+$/.test(id)
  },

  /** Object.keys() with more accurate types */
  keysOf<T extends object>(obj: T): KeysOf<T> {
    return Object.keys(obj) as KeysOf<T>
  },

  /** Checks if a search is included in a string, case insensitive */
  fuzzySearch(str: string, search: string): boolean {
    return util.canonical(str).includes(util.canonical(search))
  },

  canonical: _.memoize((str: string): string => {
    return str.toLowerCase().replace(/\W+/g, ' ').trim()
  }),

  trimLines(str: string): string {
    return str.replace(/^ +/gm, '').trim()
  },

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max))
  },
}

export default util
