import { z } from 'zod'
import env from './env.js'
import util from './util.js'

export default {
  sourceId: z.string().min(1).optional().describe('Source ID from setup() response. Defaults to most recent if not provided'),

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
