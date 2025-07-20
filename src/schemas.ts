import { z } from 'zod'
import env from './env.js'
import storage from './storage'
import util from './util.js'

export default {
  sourcePath: z.string().min(1, util.trimLines(`
    Path to a file (one of ${storage.supportedExtensions().join(', ')}).
    - Must be absolute
    - Never invent or guess one! Ask the user for it
  `)),

  sourceId: z.string().min(1).optional().describe(util.trimLines(`
    Source ID from task_setup() response
    - Defaults to most recent (across projects) if not provided
    - Try to always provide it!
    - If you don't have it, ask the user for a file path and call task_setup()
  `)),

  status: z.enum(env.STATUSES as [string, ...string[]]).describe(util.trimLines(`
    You might need to infer it from the context. e.g.:
    - "${env.STATUS_TODO}" when they say "Do this next"
    - "${env.STATUS_WIP}" when they say "First do this"
  `)),

  ids: z.array(z.string()).describe('The IDs of existing tasks'),

  index: z.number().int().min(0).optional().describe(util.trimLines(`
    0-based index to place the tasks. e.g.:
    - 0 for "Do this next"
    - Omit to place at the end ("Do this later")
  `)),
}
