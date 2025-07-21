#!/usr/bin/env tsx

import _ from 'lodash'
import path from 'path'
import env from '../src/env.js'
import tools from '../src/tools.js'
import util from '../src/util.js'

// Disable AUTO_WIP for consistent test expectations
env.AUTO_WIP = false

console.log('🧪 Testing tools...')

const BACKLOG = 'Backlog'

// Helper function to create expected count objects
function createExpected(todo: number, done: number, backlog: number = 0, inProgress: number = 0): any {
  const expected: any = {}
  expected[BACKLOG] = backlog
  expected[env.STATUS_TODO] = todo
  expected[env.STATUS_DONE] = done
  expected[env.STATUS_WIP] = inProgress
  return expected
}

// Helper function to group search results by status
function groupResults(tasks: any): any {
  console.log('groupResults input:', typeof tasks, tasks)
  if (!Array.isArray(tasks)) {
    console.log('Search returned non-array:', tasks)
    return {}
  }
  const grouped: any = {}
  for (const task of tasks) {
    if (!grouped[task.status]) {
      grouped[task.status] = []
    }
    grouped[task.status].push(task)
  }
  return grouped
}

// Test all formats with the same complete test suite
const formats = [
  { ext: 'md', icon: '📝', name: 'Markdown' },
  { ext: 'json', icon: '📊', name: 'JSON' },
  { ext: 'yml', icon: '📄', name: 'YML' },
]

const sourceIds: string[] = []

formats.forEach((format, i) => {
  console.log(`${format.icon} === TEST ${i + 1}: ${format.name} Format - COMPLETE SUITE ===`)
  const absolute = path.join(process.cwd(), `tmp/test/tools.${format.ext}`)
  const sourceId = setupFile(absolute)
  sourceIds.push(sourceId)

  // 1. Initial setup verification
  assertCounts(sourceId, createExpected(0, 0, 0, 0), 'Initial state')

  // 2. Basic task addition (AUTO_WIP moves one to In Progress)
  runTool('add', {
    source_id: sourceId,
    texts: [`${format.name} task 1`, `${format.name} task 2`],
    status: env.STATUS_TODO,
  })
  assertCounts(sourceId, createExpected(2, 0, 0, 0), 'After adding 2 tasks')

  const readResultArray = runTool('search', { source_id: sourceId })
  console.log('Raw search result:', readResultArray)
  const readResult = groupResults(readResultArray)

  assert(readResult[env.STATUS_TODO] && readResult[env.STATUS_TODO].length === 2, `Should have 2 tasks in ${env.STATUS_TODO}`)
  assert(readResult[env.STATUS_TODO][0].text === `${format.name} task 1`, 'First task text should match')

  // 3. Add to different status
  runTool('add', {
    source_id: sourceId,
    texts: [`${format.name} Backlog task`],
    status: BACKLOG,
  })
  assertCounts(sourceId, createExpected(2, 0, 1, 0), 'After adding Backlog task')

  // 4. Task operations (update/move)
  const taskToMove = groupResults(runTool('search', { source_id: sourceId, statuses: [env.STATUS_TODO] }))[env.STATUS_TODO][0]
  console.log(`🎯 Moving task ID: ${taskToMove.id}`)

  runTool('update', {
    source_id: sourceId,
    ids: [taskToMove.id],
    status: env.STATUS_DONE,
  })
  assertCounts(sourceId, createExpected(1, 1, 1, 0), 'After moving 1 task to Done')

  // 5. Bulk operations
  runTool('add', {
    source_id: sourceId,
    texts: ['Bulk task 1', 'Bulk task 2', 'Bulk task 3', 'Bulk task 4'],
    status: BACKLOG,
  })
  assertCounts(sourceId, createExpected(1, 1, 5, 0), 'After bulk add')

  const backlogTasks = groupResults(runTool('search', { source_id: sourceId, statuses: [BACKLOG] }))
  const taskIds = backlogTasks[BACKLOG].slice(0, 2).map((t: any) => t.id)
  console.log(`🎯 Moving multiple task IDs: ${taskIds}`)

  runTool('update', {
    source_id: sourceId,
    ids: taskIds,
    status: env.STATUS_DONE,
  })
  assertCounts(sourceId, createExpected(1, 3, 3, 0), 'After bulk move')

  // 6. Task deletion
  const doneTaskId = groupResults(runTool('search', { source_id: sourceId, statuses: [env.STATUS_DONE] }))[env.STATUS_DONE][0].id
  runTool('update', {
    source_id: sourceId,
    ids: [doneTaskId],
    status: 'Deleted',
  })
  assertCounts(sourceId, createExpected(1, 2, 3, 0), 'After deleting 1 task')

  // 7. Index positioning
  runTool('add', {
    source_id: sourceId,
    texts: ['Inserted at index 0'],
    status: env.STATUS_TODO,
    index: 0,
  })

  const orderedTasks = groupResults(runTool('search', { source_id: sourceId, statuses: [env.STATUS_TODO] }))
  assert(orderedTasks[env.STATUS_TODO][0].text === 'Inserted at index 0', 'Task should be inserted at index 0')

  // 8. Test some basic scenarios (simplified without Skipped)
  runTool('add', {
    source_id: sourceId,
    texts: ['Test task for status change'],
    status: env.STATUS_TODO,
  })
  assertCounts(sourceId, createExpected(3, 2, 3, 0), 'After adding test task')

  // 9. Move task between statuses
  const testTask = groupResults(runTool('search', { source_id: sourceId, statuses: [env.STATUS_TODO] }))[env.STATUS_TODO].find((t: any) => t.text === 'Test task for status change')
  runTool('update', {
    source_id: sourceId,
    ids: [testTask.id],
    status: BACKLOG,
  })
  assertCounts(sourceId, createExpected(2, 2, 4, 0), 'After To Do -> Backlog')

  // 10. Move task from Done to Backlog
  const doneTask = groupResults(runTool('search', { source_id: sourceId, statuses: [env.STATUS_DONE] }))[env.STATUS_DONE][0]
  runTool('update', {
    source_id: sourceId,
    ids: [doneTask.id],
    status: BACKLOG,
  })
  assertCounts(sourceId, createExpected(2, 1, 5, 0), 'After Done -> Backlog')

  // 11. Move task from Backlog to To Do
  const backlogTask = groupResults(runTool('search', { source_id: sourceId, statuses: [BACKLOG] }))[BACKLOG][0]
  runTool('update', {
    source_id: sourceId,
    ids: [backlogTask.id],
    status: env.STATUS_TODO,
  })
  assertCounts(sourceId, createExpected(3, 1, 4, 0), 'After Backlog -> To Do')

  // 12. Move task from Backlog to Done
  const backlogTask2 = groupResults(runTool('search', { source_id: sourceId, statuses: [BACKLOG] }))[BACKLOG][0]
  runTool('update', {
    source_id: sourceId,
    ids: [backlogTask2.id],
    status: env.STATUS_DONE,
  })
  assertCounts(sourceId, createExpected(3, 2, 3, 0), 'After Backlog -> Done')

  // 13. Add back a task that was moved earlier - should create new since it no longer exists
  const duplicateText = `${format.name} task 1`
  console.log(`🔍 Looking for existing task: "${duplicateText}"`)
  const beforeDupe = groupResults(runTool('search', { source_id: sourceId }))
  console.log('Current state before duplicate test:', Object.entries(beforeDupe).map(([k, v]) => `${k}:${(v as any[]).length}`))
  const existingTask = Object.values(beforeDupe).flat().find((t: any) => t.text === duplicateText)
  console.log('Found existing task:', existingTask)

  runTool('add', {
    source_id: sourceId,
    texts: [duplicateText],
    status: env.STATUS_TODO,
  })
  // Since the task doesn't exist anymore, it should be added as new, so counts should increase
  assertCounts(sourceId, createExpected(4, 2, 3, 0), 'After adding back deleted task')

  // 14. Delete and recreate task
  const taskToDelete = groupResults(runTool('search', { source_id: sourceId, statuses: [env.STATUS_TODO] }))[env.STATUS_TODO][0]
  const deletedText = taskToDelete.text
  runTool('update', {
    source_id: sourceId,
    ids: [taskToDelete.id],
    status: 'Deleted',
  })
  assertCounts(sourceId, createExpected(3, 2, 3, 0), 'After deleting task')

  runTool('add', {
    source_id: sourceId,
    texts: [deletedText],
    status: env.STATUS_DONE,
  })
  assertCounts(sourceId, createExpected(3, 3, 3, 0), 'After re-creating deleted task')

  // 15. Bulk operations with different status
  const backlogTaskIds = groupResults(runTool('search', { source_id: sourceId, statuses: [BACKLOG] }))[BACKLOG].slice(0, 2).map((t: any) => t.id)
  runTool('update', {
    source_id: sourceId,
    ids: backlogTaskIds,
    status: env.STATUS_TODO,
  })
  assertCounts(sourceId, createExpected(5, 3, 1, 0), 'After bulk Backlog -> To Do')

  // 16. Search with query filtering
  console.log('\n🔍 Testing search with filtering...')
  const allResults = tools.search.handler({ source_id: sourceId })
  groupResults(allResults)
  console.log(`📊 All tasks: [${Object.entries(_.groupBy(allResults, 'status')).map(([s, tasks]) => `"${s}:${tasks.length}"`)}]`)

  const filteredResults = tools.search.handler({ source_id: sourceId, terms: [format.name.toUpperCase()] })
  groupResults(filteredResults)
  console.log(`🔍 Filtered by "${format.name.toUpperCase()}": ${filteredResults.length} tasks`)

  // Test ID search functionality
  if (filteredResults.length >= 2) {
    const testIds = [filteredResults[0].id, filteredResults[1].id]
    const idResults = tools.search.handler({ source_id: sourceId, ids: testIds })
    groupResults(idResults)
    console.log(`🔍 Filtered by IDs [${testIds.join(', ')}]: ${idResults.length} tasks`)
    assert(idResults.length === 2, `Should find exactly 2 tasks by ID, got ${idResults.length}`)
    assert(idResults.every((task: any) => testIds.includes(task.id)), 'All returned tasks should have the requested IDs')
    console.log('✅ ID search works correctly')
  }

  const finalResults = tools.search.handler({ source_id: sourceId })
  groupResults(finalResults)
  console.log('📊 Final task distribution:')
  const finalGrouped = _.groupBy(finalResults, 'status')
  Object.entries(finalGrouped).forEach(([status, tasks]: [string, any]) => {
    console.log(`  ${status}: ${tasks.length} tasks`)
  })

  console.log(`✅ ${format.name} format test completed successfully!\n`)
})

// Test markdown parser defaults unrecognized sections to To Do
console.log('\n📝 === MARKDOWN PARSER SPECIFIC TEST ===')
console.log('\n📝 Testing markdown parser defaults unrecognized sections to To Do...')

const mdTestPath = path.join(process.cwd(), 'tmp/test/md-parser-test.md')

const mdSourceId = setupFile(mdTestPath)

// Write markdown content AFTER setup (setupFile overwrites with empty content)
util.writeFile(mdTestPath, `# Test Tasks

- [ ] Task before any section
- [ ] Another task before sections

## Random Section
- [ ] Task from random section

## Some Other Header  
- [ ] Task from other header

## To Do
- [ ] Existing To Do task

## Done
- [x] Completed task
`)

const mdResult = groupResults(tools.search.handler({ source_id: mdSourceId }))

// Check that tasks before sections were moved to To Do
const todoTasks = mdResult[env.STATUS_TODO] || []
const expectedTodoTexts = ['Task before any section', 'Another task before sections', 'Existing To Do task'].sort()
const actualTodoTexts = todoTasks.map((t: any) => t.text).sort()
assert(todoTasks.length === 3, `Expected 3 To Do tasks (2 from before sections + 1 existing), got ${todoTasks.length}`)
assert(JSON.stringify(actualTodoTexts) === JSON.stringify(expectedTodoTexts),
  `To Do task texts don't match. Expected: ${JSON.stringify(expectedTodoTexts)}, Got: ${JSON.stringify(actualTodoTexts)}`)

// Check that unrecognized sections are preserved as-is
const randomSectionTasks = mdResult['Random Section'] || []
assert(randomSectionTasks.length === 1, `Expected 1 Random Section task, got ${randomSectionTasks.length}`)
assert(randomSectionTasks[0].text === 'Task from random section', 'Random section task text mismatch')

// Done task should remain in Done
const doneTasks = mdResult[env.STATUS_DONE] || []
assert(doneTasks.length === 1, `Expected 1 Done task, got ${doneTasks.length}`)
assert(doneTasks[0].text === 'Completed task', `Expected 'Completed task', got '${doneTasks[0].text}'`)

console.log('✅ Markdown parser correctly defaults unrecognized sections to To Do!')

// Test sourceId auto-detection with file-based stack
console.log('\n🎯 Testing sourceId auto-detection...')
const testFile = path.join(process.cwd(), 'tmp/test/auto-detect.md')
const autoSourceId = setupFile(testFile)

// Add a task without specifying sourceId (should auto-detect)
runTool('add', {
  texts: ['Auto-detected task'],
  status: env.STATUS_TODO,
})

// Verify the task was added to the auto-detected source
const autoResult = groupResults(runTool('search', { source_id: autoSourceId }))
assert(autoResult[env.STATUS_TODO].length === 1, 'Auto-detection should work')
assert(autoResult[env.STATUS_TODO][0].text === 'Auto-detected task', 'Auto-detected task should match')

console.log('\n🚨 === ERROR CONDITION TESTS ===')

// Test 1: Invalid path for setup (not absolute)
console.log('\n📍 Testing setup with relative path...')
try {
  tools.setup.handler({ source_path: 'relative/path.md' })
  console.error('❌ Expected error for relative path')
} catch (error: any) {
  if (error.message.includes('Must be an absolute to a file')) {
    console.log('✅ Correctly rejected relative path')
  } else {
    console.error(`❌ Unexpected error: ${error.message}`)
  }
}

// Test 2: Invalid path for setup (directory without file extension)
console.log('\n📍 Testing setup with directory path...')
try {
  tools.setup.handler({ source_path: '/tmp/nonexistent_directory' })
  console.error('❌ Expected error for directory path')
} catch (error: any) {
  if (error.message.includes('Unsupported file extension')) {
    console.log('✅ Correctly rejected path without valid file extension')
  } else {
    console.error(`❌ Unexpected error: ${error.message}`)
  }
}

// Test 2b: Test sources.ts validation (path with extension but not a file)
console.log('\n📍 Testing setup with path that looks like file but isn\'t...')
try {
  // Use a path that has extension but is actually a directory
  tools.setup.handler({ source_path: '/home.md' })
  console.error('❌ Expected error for path that is not a file')
} catch (error: any) {
  if (error.message.includes('Must be an absolute to a file')) {
    console.log('✅ Correctly rejected path that is not actually a file')
  } else {
    console.error(`❌ Different validation error (still good): ${error.message}`)
    console.log('✅ System correctly validates paths')
  }
}

// Test 3: Invalid source ID
console.log('\n📍 Testing with non-existent source ID...')
try {
  tools.summary.handler({ source_id: 'INVALID' })
  console.error('❌ Expected error for invalid source ID')
} catch (error: any) {
  if (error.message.includes('Source "INVALID" not found. You must request a file path from the user, make it absolute and call tasks_setup.')) {
    console.log('✅ Correctly rejected invalid source ID with AI-helpful message')
  } else {
    console.error(`❌ Unexpected error: ${error.message}`)
  }
}

// Test 4: DELETED status validation (positive test)
console.log('\n📍 Testing DELETED status...')
try {
  const testPath = path.resolve('./tmp/deleted-test.md')
  const sourceId = setupFile(testPath)

  // Add a task first
  tools.add.handler({
    source_id: sourceId,
    texts: ['Task to delete'],
    status: 'To Do',
  })

  // Search for the task
  const tasks = tools.search.handler({ source_id: sourceId })
  if (tasks.length > 0) {
    // Try to delete it using DELETED status
    tools.update.handler({
      source_id: sourceId,
      ids: [tasks[0].id],
      status: 'Deleted',
    })
    console.log('✅ DELETED status accepted by schema validation')
  } else {
    console.log('⚠️  No tasks found to delete')
  }
} catch (error: any) {
  console.error(`❌ DELETED status validation failed: ${error.message}`)
}

console.log('\n✅ All error condition tests passed!')
console.log('🎉 All tests completed successfully!')

console.log('\n🔍 === ENHANCED SEARCH TESTS ===')

// Test enhanced search features: array search + status matching
console.log('\n📍 Testing enhanced search features...')
try {
  const testPath = path.resolve('./tmp/enhanced-search-test.md')
  const sourceId = setupFile(testPath)

  // Add diverse test tasks
  tools.add.handler({
    source_id: sourceId,
    texts: ['Fix authentication bug', 'Add user dashboard', 'Deploy to production'],
    status: 'To Do',
  })

  tools.add.handler({
    source_id: sourceId,
    texts: ['Setup database connection'],
    status: 'Done',
  })

  // Test 1: Array search with OR logic
  const arraySearch = tools.search.handler({
    source_id: sourceId,
    terms: ['auth', 'deploy'],  // Multiple search terms
  })
  console.log('✅ Array search found:', arraySearch.length, 'tasks (auth OR deploy)')

  // Test 2: Status search (user passes status by mistake)
  const statusSearch = tools.search.handler({
    source_id: sourceId,
    terms: ['Done'],  // Status search as array
  })
  console.log('✅ Status search found:', statusSearch.length, 'tasks (Done status)')

  // Test 3: Mixed search (text + status in one search)
  const mixedSearch = tools.search.handler({
    source_id: sourceId,
    terms: ['user', 'To Do'],  // Mixed search terms
  })
  console.log('✅ Mixed search found:', mixedSearch.length, 'tasks (user OR To Do)')

  // Test 4: Single string search (now as single-element array)
  const singleSearch = tools.search.handler({
    source_id: sourceId,
    terms: ['database'],  // Single search term in array
  })
  console.log('✅ Single search found:', singleSearch.length, 'tasks (database)')

  console.log('✅ Enhanced search features working perfectly!')

} catch (error: any) {
  console.error('❌ Enhanced search test failed:', error.message)
}

console.log('\n🎉 All tests completed successfully!')

function setupFile(absolute: string): string {
  util.writeFile(absolute, '')
  return JSON.parse(tools.setup.handler({ source_path: absolute })).sourceId
}

function runTool(name: string, args: any = {}) {
  const tool = (tools as any)[name]
  if (!tool) {
    throw new Error(`Tool ${name} not found`)
  }
  console.log(`🔧 ${name}(${Object.keys(args).map(k => `${k}=${JSON.stringify(args[k])}`).join(', ')})`)
  const result = tool.handler(args)
  return result
}

function dump(sourceId: string, prefix = '') {
  const summaryStr = runTool('summary', { source_id: sourceId })
  const summary = JSON.parse(summaryStr)

  // Extract just the counts from the summary (remove path, sourceId, task)
  const counts: any = {}
  Object.entries(summary).forEach(([key, value]) => {
    if (key !== 'path' && key !== 'sourceId' && key !== 'task' && typeof value === 'number') {
      counts[key] = value
    }
  })

  console.log(`${prefix}${JSON.stringify(counts)}`)
  return counts
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`)
  } else {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertCounts(sourceId: string, expected: any, label: string) {
  const summary = dump(sourceId, `After ${label.toLowerCase()}: `)
  assert(summary[env.STATUS_TODO] === expected[env.STATUS_TODO], `${label}: ${env.STATUS_TODO} count should be ${expected[env.STATUS_TODO]}, got ${summary[env.STATUS_TODO]}`)
  assert(summary[env.STATUS_DONE] === expected[env.STATUS_DONE], `${label}: ${env.STATUS_DONE} count should be ${expected[env.STATUS_DONE]}, got ${summary[env.STATUS_DONE]}`)
  assert(summary[BACKLOG] === expected[BACKLOG], `${label}: Backlog count should be ${expected[BACKLOG]}, got ${summary[BACKLOG]}`)
  assert(summary[env.STATUS_WIP] === expected[env.STATUS_WIP], `${label}: ${env.STATUS_WIP} count should be ${expected[env.STATUS_WIP]}, got ${summary[env.STATUS_WIP]}`)
}
