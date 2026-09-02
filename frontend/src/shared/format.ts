import type { Todo, TodoPriority } from './types'

const short = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
})

const long = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatShort(iso: string | null): string {
  if (!iso) return ''
  return short.format(new Date(iso))
}

export function formatLong(iso: string): string {
  return long.format(new Date(iso))
}

export function isOverdue(todo: Pick<Todo, 'dueAt' | 'completed'>): boolean {
  if (!todo.dueAt || todo.completed) return false
  return new Date(todo.dueAt).getTime() < Date.now()
}

export function toDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDateInput(value: string): string | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).toISOString()
}

export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function labelPriority(p: TodoPriority): string {
  if (p === 'high') return 'High'
  if (p === 'low') return 'Low'
  return 'Medium'
}
