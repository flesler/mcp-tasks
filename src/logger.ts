import fs from 'fs'
import env from './env.js'
import pkg from './pkg.js'
import util from './util.js'

// Can't log to stdio as it disrupts the JSON-RPC protocol
const LOG_FILE = util.resolve('./logs.json')

function formatMessage(level: string, msg: string, data?: object): string {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    version: pkg.version,
    cwd: util.CWD,
    message: msg,
    ...data,
  }
  return JSON.stringify(logEntry) + '\n'
}

function writeLog(level: string, msg: string, data?: object): void {
  if (!env.DEBUG) {
    return
  }
  try {
    const formatted = formatMessage(level, msg, data)
    fs.appendFileSync(LOG_FILE, formatted, 'utf-8')
  } catch (err) {
    // Fallback to stderr if file writing fails
    console.error('Logger error:', err)
  }
}

const logger = {
  log: (msg: string, data?: object) => writeLog('LOG', msg, data),
  info: (msg: string, data?: object) => writeLog('INFO', msg, data),
  warn: (msg: string, data?: object) => writeLog('WARN', msg, data),
  error: (msg: string, data?: object) => writeLog('ERROR', msg, data),
}

export default logger
