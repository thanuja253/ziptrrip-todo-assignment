import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError, createTodo, deleteTodo, listTodos, updateTodo } from '../../shared/api'
import { formatShort, fromDateInput, isOverdue, labelPriority, parseTags } from '../../shared/format'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { Shell } from '../../shared/Shell'
import type { StatusFilter, Todo, TodoPriority } from '../../shared/types'
import { useDebounced } from '../../shared/useDebounced'

const PRIORITIES: TodoPriority[] = ['high', 'medium', 'low']

export function ListPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [priority, setPriority] = useState<TodoPriority | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [draftPriority, setDraftPriority] = useState<TodoPriority>('medium')
  const [due, setDue] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const qDebounced = useDebounced(q)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    listTodos({ q: qDebounced, status, priority })
      .then((rows) => {
        if (!cancelled) setTodos(rows)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Could not load todos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [qDebounced, status, priority])

  const tally = useMemo(() => {
    if (status !== 'all' || priority || qDebounced.trim()) {
      return `${todos.length} matching`
    }
    const open = todos.filter((t) => !t.completed).length
    return `${open} open · ${todos.length - open} done`
  }, [todos, status, priority, qDebounced])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createTodo({
        title: title.trim(),
        description: description.trim(),
        priority: draftPriority,
        tags: parseTags(tags),
        dueAt: fromDateInput(due),
      })
      setTitle('')
      setDescription('')
      setTags('')
      setDue('')
      setDraftPriority('medium')
      const rows = await listTodos({ q: qDebounced, status, priority })
      setTodos(rows)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add todo.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(todo: Todo) {
    const next = !todo.completed
    setTodos((rows) => rows.map((r) => (r.id === todo.id ? { ...r, completed: next } : r)))
    try {
      await updateTodo(todo.id, { completed: next })
    } catch (err) {
      setTodos((rows) => rows.map((r) => (r.id === todo.id ? todo : r)))
      setError(err instanceof ApiError ? err.message : 'Could not update todo.')
    }
  }

  async function confirmRemove() {
    if (!pending) return
    const snapshot = todos
    const target = pending
    setTodos((rows) => rows.filter((r) => r.id !== target.id))
    setDeleting(true)
    try {
      await deleteTodo(target.id)
      setPending(null)
    } catch (err) {
      setTodos(snapshot)
      setError(err instanceof ApiError ? err.message : 'Could not delete todo.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Shell kicker="Todos">
      <main className="sheet">
        <h1 className="page-title">Todos</h1>
        <p className="lede">
          Add a task, check it off, or open it to edit the details.
        </p>

        <form className="composer" onSubmit={onCreate}>
          <input
            type="text"
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={180}
            required
            aria-label="Title"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            aria-label="Description"
          />
          <div className="row-fields">
            <div className="field priority-select">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as TodoPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {labelPriority(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="due">Due date</label>
              <input
                id="due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                type="text"
                placeholder="work, home"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>

        <div className="toolbar">
          <div className="search">
            <input
              type="text"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search"
            />
          </div>
          <div className="filters" role="group" aria-label="Status">
            {(['all', 'open', 'done'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                className="chip"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
              >
                {s === 'all' ? 'All' : s === 'open' ? 'Open' : 'Done'}
              </button>
            ))}
          </div>
          <div className="filters" role="group" aria-label="Priority">
            <button
              type="button"
              className="chip"
              aria-pressed={priority === ''}
              onClick={() => setPriority('')}
            >
              All priorities
            </button>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className="chip"
                aria-pressed={priority === p}
                onClick={() => setPriority(p)}
              >
                {labelPriority(p)}
              </button>
            ))}
          </div>
          <p className="tally">{loading ? '…' : tally}</p>
        </div>

        {error ? <div className="banner">{error}</div> : null}

        {loading ? (
          <div className="skel" aria-hidden="true">
            <div className="skel-line" />
            <div className="skel-line" />
            <div className="skel-line" />
          </div>
        ) : todos.length === 0 ? (
          <div className="empty">
            <p>
              <em>No todos yet.</em>
              <br />
              Add one above, or clear the filters.
            </p>
          </div>
        ) : (
          <ul className="list">
            {todos.map((todo) => (
              <li key={todo.id} className={`slip${todo.completed ? ' is-done' : ''}`}>
                <span className={`stub ${todo.priority}`} aria-hidden="true" />
                <input
                  className="check"
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => void toggle(todo)}
                  aria-label={todo.completed ? 'Mark open' : 'Mark done'}
                />
                <div className="body">
                  <a className="title" href={`/todo.html?id=${todo.id}`}>
                    {todo.title}
                  </a>
                  <div className="meta">
                    <span>{labelPriority(todo.priority)}</span>
                    {todo.dueAt ? (
                      <span className={`due${isOverdue(todo) ? ' late' : ''}`}>
                        {isOverdue(todo) ? 'overdue ' : 'due '}
                        {formatShort(todo.dueAt)}
                      </span>
                    ) : null}
                    {todo.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="side">
                  <button type="button" className="icon-btn" onClick={() => setPending(todo)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      {pending ? (
        <ConfirmDialog
          title="Delete this todo?"
          body={`“${pending.title}” will be removed. This cannot be undone.`}
          busy={deleting}
          onCancel={() => {
            if (!deleting) setPending(null)
          }}
          onConfirm={() => void confirmRemove()}
        />
      ) : null}
    </Shell>
  )
}
