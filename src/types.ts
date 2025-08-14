import type { ZodSchema } from 'zod'
import type z from 'zod'

export interface SourceRaw {
  path: string
  workspace: string
}

export interface Source extends SourceRaw {
  id: string
}

export interface State {
  groups: Record<string, string[]>
}

export interface FormatParser {
  read(path: string): State
  write(path: string, state: State): void
}

export interface Task {
  id: string
  text: string
  status: string
  index: number
}

export interface Metadata {
  source: Source
  state: State
  groups: Record<string, Task[]>
  tasks: Task[]
  tasksByIdOrText: Record<string, Task>
  statuses: string[]
}

export interface Tool<S extends ZodSchema = ZodSchema> {
  schema: S
  description: string
  isResource: boolean
  isReadOnly: boolean
  handler: (args: z.infer<S>, context?: any) => any
  fromArgs: (args: string[]) => z.infer<S>
}
