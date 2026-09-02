import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, deleteTodo, getTodo, updateTodo } from '../../shared/api'
import {
  formatLong,
  fromDateInput,
  parseTags,
  toDateInput,
} from '../../shared/format'
import { Shell } from '../../shared/Shell'
import type { Todo, TodoPriority } from '../../shared/types'

const PRIORITIES: TodoPriority[] = ['high', 'medium', 'low']

function idFromQuery(): string | null {
  const id = new URLSearchParams(window.location.search).get('id')
  return id?.trim() || null
}

export function DetailPage() {
  const id = idFromQuery()
  const [todo, setTodo] = useState<Todo | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [due, setDue] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('This page expects ?id= on the query string.')
      return
    }

    getTodo(id)
      .then((row) => {
        setTodo(row)
        fill(row)
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('That ticket is not in the drawer.')
        } else {
          setError(err instanceof ApiError ? err.message : 'Could not load this todo.')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  function fill(row: Todo) {
    setTitle(row.title)
    setDescription(row.description)
    setPriority(row.priority)
    setDue(toDateInput(row.dueAt))
    setTags(row.tags.join(', '))
  }

  const dirty =
    !!todo &&
    (title !== todo.title ||
      description !== todo.description ||
      priority !== todo.priority ||
      toDateInput(todo.dueAt) !== due ||
      todo.tags.join(', ') !== tags)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!id || !todo) return
    setSaving(true)
    setError(null)
    try {
      const next = await updateTodo(id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        tags: parseTags(tags),
        dueAt: fromDateInput(due),
      })
      setTodo(next)
      fill(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle() {
    if (!id || !todo) return
    try {
      const next = await updateTodo(id, { completed: !todo.completed })
      setTodo(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status.')
    }
  }

  async function remove() {
    if (!id || !todo) return
    if (!window.confirm(`Drop “${todo.title}”?`)) return
    try {
      await deleteTodo(id)
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete.')
    }
  }

  return (
    <Shell kicker="one ticket">
      <main className="sheet">
        <a className="back" href="/">
          ← the list
        </a>

        {loading ? (
          <div className="skel">
            <div className="skel-line" />
            <div className="skel-line" />
          </div>
        ) : null}

        {error ? <div className="banner">{error}</div> : null}

        {todo ? (
          <>
            <div className="detail-head">
              <h1 className="page-title">{todo.title}</h1>
              <span className={`badge${todo.completed ? '' : ' open'}`}>
                {todo.completed ? 'done' : 'open'}
              </span>
            </div>

            <form className="editor" onSubmit={onSave}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={180}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="body">Note</label>
                <textarea
                  id="body"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div className="row-fields">
                <div className="field">
                  <label htmlFor="priority">Weight</label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="due">Due</label>
                  <input
                    id="due"
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </div>
                <div className="field span-2">
                  <label htmlFor="tags">Tags</label>
                  <input
                    id="tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="comma separated"
                  />
                </div>
              </div>

              <div className="actions">
                <button className="btn" type="submit" disabled={saving || !dirty || !title.trim()}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn ghost" type="button" onClick={() => void toggle()}>
                  {todo.completed ? 'Reopen' : 'Mark done'}
                </button>
                <button className="btn danger" type="button" onClick={() => void remove()}>
                  Drop ticket
                </button>
              </div>
            </form>

            <div className="stamp">
              <div>
                <b>Opened</b>
                {formatLong(todo.createdAt)}
              </div>
              <div>
                <b>Last ink</b>
                {formatLong(todo.updatedAt)}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </Shell>
  )
}
