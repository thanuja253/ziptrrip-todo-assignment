import type { StatusFilter, Todo, TodoDraft, TodoPriority } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function listTodos(opts: {
  q?: string
  status?: StatusFilter
  priority?: TodoPriority | ''
} = {}): Promise<Todo[]> {
  const params = new URLSearchParams()
  if (opts.q?.trim()) params.set('q', opts.q.trim())
  if (opts.status && opts.status !== 'all') params.set('status', opts.status)
  if (opts.priority) params.set('priority', opts.priority)
  const qs = params.toString()
  return request(`/todos${qs ? `?${qs}` : ''}`)
}

export function getTodo(id: string): Promise<Todo> {
  return request(`/todos/${id}`)
}

export function createTodo(draft: TodoDraft): Promise<Todo> {
  return request('/todos', { method: 'POST', body: JSON.stringify(draft) })
}

export function updateTodo(id: string, patch: Partial<TodoDraft> & { completed?: boolean }): Promise<Todo> {
  return request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function deleteTodo(id: string): Promise<void> {
  return request(`/todos/${id}`, { method: 'DELETE' })
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Is the server running on port 3000?')
  }

  if (res.status === 204) return undefined as T

  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, messageFrom(body, res.statusText))
  }
  return body as T
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message: unknown }).message
    if (Array.isArray(msg)) return msg.join(' · ')
    if (typeof msg === 'string') return msg
  }
  return fallback
}
