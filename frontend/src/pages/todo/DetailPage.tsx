import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, deleteTodo, getTodo, updateTodo } from '../../shared/api'
import {
  formatLong,
  fromDateInput,
  labelPriority,
  parseTags,
  toDateInput,
} from '../../shared/format'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
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
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('No todo id in the URL.')
      return
    }

    getTodo(id)
      .then((row) => {
        setTodo(row)
        fill(row)
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('This todo does not exist.')
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
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
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

  async function confirmRemove() {
    if (!id || !todo) return
    setDeleting(true)
    try {
      await deleteTodo(id)
      window.location.href = '/'
    } catch (err) {
      setDeleting(false)
      setPendingDelete(false)
      setError(err instanceof ApiError ? err.message : 'Could not delete.')
    }
  }

  return (
    <Shell kicker="Details">
      <main className="sheet">
        <a className="back" href="/">
          ← Todos
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
                {todo.completed ? 'Done' : 'Open'}
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
                <label htmlFor="body">Description</label>
                <textarea
                  id="body"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div className="row-fields">
                <div className="field">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
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
                <div className="field span-2">
                  <label htmlFor="tags">Tags</label>
                  <input
                    id="tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="work, home"
                  />
                </div>
              </div>

              <div className="actions">
                <button className="btn" type="submit" disabled={saving || !title.trim()}>
                  {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                </button>
                <button className="btn ghost" type="button" onClick={() => void toggle()}>
                  {todo.completed ? 'Reopen' : 'Mark done'}
                </button>
                <button className="btn danger" type="button" onClick={() => setPendingDelete(true)}>
                  Delete
                </button>
              </div>
            </form>

            <div className="stamp">
              <div>
                <b>Created</b>
                {formatLong(todo.createdAt)}
              </div>
              <div>
                <b>Updated</b>
                {formatLong(todo.updatedAt)}
              </div>
            </div>
          </>
        ) : null}
      </main>
      {pendingDelete && todo ? (
        <ConfirmDialog
          title="Delete this todo?"
          body={`“${todo.title}” will be removed. This cannot be undone.`}
          busy={deleting}
          onCancel={() => {
            if (!deleting) setPendingDelete(false)
          }}
          onConfirm={() => void confirmRemove()}
        />
      ) : null}
    </Shell>
  )
}
