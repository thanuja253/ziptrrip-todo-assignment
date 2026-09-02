# Features

Anything not listed here is not part of the assignment submission.

## List page (`/`, `index.html`)

- Add a todo: title (required), note, weight (low / medium / high), due date, comma-separated tags
- Render every todo as a ticket: checkbox, title, weight colour on the stub, due date, tags
- Title is a real link to `/todo.html?id=<id>` — the browser loads a second HTML document
- Mark done / open from the checkbox (optimistic, rolls back on failure)
- Delete from the row (“Drop”), with a confirm
- Search against title, note, and tags (debounced, server-side)
- Filter by status: all / open / done
- Filter by weight
- Count: `n open · n done` on the unfiltered list, otherwise `n matching`
- Loading skeleton, error banner, empty blotter copy
- Overdue dates render in wine if the ticket is still open

## Ticket page (`/todo.html?id=`)

- Reads `id` from the query string, not from a path segment
- Fetches `GET /api/todos/:id`
- Shows title, note, weight, due date, tags, created at, updated at, open/done
- Edit in place; Save stays disabled until something actually changed
- Mark done / reopen
- Delete, then the browser goes back to the list
- Missing `?id=`, unknown id (404), and API-down states all have copy

## API

- `POST /api/todos` — create
- `GET /api/todos` — list, with `q`, `status=open|done`, `priority=low|medium|high`
- `GET /api/todos/:id` — one todo (this is what the ticket page uses)
- `PATCH /api/todos/:id` — partial update
- `PUT /api/todos/:id` — same handler as PATCH, because the brief’s sample used PUT
- `DELETE /api/todos/:id` — 204, no body

Ids in JSON are strings. Mongo’s `_id` never leaks to the client.

## Persistence

- MongoDB. Collection `todos`.
- First process start on an empty collection inserts four travel-shaped sample rows.

## Validation and errors

- class-validator on write DTOs: title length, enum weight, ISO dates, max 8 tags
- Unknown JSON keys are rejected (`forbidNonWhitelisted`)
- Junk ids return 400 before a Mongo round-trip
- Missing documents return 404

## Not in scope

- Auth
- Pagination
- File attachments
- Client-side routing
