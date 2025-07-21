import fs from 'fs'
import env from './env.js'
import pkg from './pkg.js'
import util from './util.js'

// Can't log to stdio as it disrupts the JSON-RPC protocol
const LOG_FILE = util.resolve('./app.log')

function formatMessage(level: string, ...args: any[]): string {
  const timestamp = new Date().toISOString()
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
  ).join(' ')
  return [timestamp, pkg.version, util.CWD, level, message].join('\t') + '\n'
}

function writeLog(level: string, ...args: any[]): void {
  if (!env.DEBUG) {
    return
  }
  try {
    const formatted = formatMessage(level, ...args)
    fs.appendFileSync(LOG_FILE, formatted, 'utf-8')
  } catch (err) {
    // Fallback to stderr if file writing fails
    console.error('Logger error:', err)
  }
}

const logger = {
  log: (...args: any[]) => writeLog('LOG', ...args),
  info: (...args: any[]) => writeLog('INFO', ...args),
  warn: (...args: any[]) => writeLog('WARN', ...args),
  error: (...args: any[]) => writeLog('ERROR', ...args),
}

export default logger
