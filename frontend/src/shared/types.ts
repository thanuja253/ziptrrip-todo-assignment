export type TodoPriority = 'low' | 'medium' | 'high'
export type StatusFilter = 'all' | 'open' | 'done'

export type Todo = {
  id: string
  title: string
  description: string
  completed: boolean
  priority: TodoPriority
  tags: string[]
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

export type TodoDraft = {
  title: string
  description: string
  priority: TodoPriority
  tags: string[]
  dueAt: string | null
  completed?: boolean
}
