import { z } from 'zod'
import env from './env.js'
import storage from './storage.js'
import util from './util.js'

export default {
  sourcePath: z.string().min(1, util.trimLines(`
    Path to a file (one of ${storage.supportedExtensions().join(', ')}).
    - It can be relative if you provide a workspace/project path
    - Otherwise it must be absolute!
    - Never invent or guess one! Ask the user for it
  `)),

  sourceId: z.string().min(1).optional().describe(util.trimLines(`
    Source ID from task_setup() response
    - Defaults to most recent in the workspace if not provided
    - Try to always provide it!
    - If you don't have it, ask the user for a file path and call task_setup()
  `)),

  status: z.enum(env.STATUSES as [string, ...string[]]).describe(util.trimLines(`
    You might need to infer it from the context:
    - "${env.STATUS_TODO}" for tasks coming up next (e.g. "Do X next")
    - "${env.STATUS_WIP}" for what you\'ll do now (e.g. "First do X")
    ${env.STATUS_NOTES ? `- "${env.STATUS_NOTES}" to collect non-actionable notes` : ''}
  `)),

  ids: z.array(z.string()).describe('The IDs of existing tasks'),

  index: z.number().int().min(0).optional().describe(util.trimLines(`
    0-based index to place the tasks. e.g.:
    - 0 for "Do this next"
    - Omit to place at the end ("Do this later")
  `)),
}
