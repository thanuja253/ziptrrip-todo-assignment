# API

Base URL: `http://localhost:3000/api`

All responses (except `DELETE`) are JSON. Dates are ISO-8601 strings. `dueAt` is `null` when unset.

A todo looks like this:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Hold the Lisbon apartment deposit",
  "description": "Host wants the remainder by Friday.",
  "completed": false,
  "priority": "high",
  "tags": ["lisbon", "money"],
  "dueAt": "2026-09-04T06:30:00.000Z",
  "createdAt": "2026-09-01T08:00:00.000Z",
  "updatedAt": "2026-09-01T08:00:00.000Z"
}
```

`priority` is `low` | `medium` | `high`.

## POST /todos

Create. `title` is the only required field.

```json
{
  "title": "Book airport transfer",
  "description": "Prefer the 06:40 slot.",
  "priority": "medium",
  "tags": ["lisbon"],
  "dueAt": "2026-09-12T10:00:00.000Z"
}
```

`201`. Tags are trimmed, lowercased, de-duplicated, capped at 8.

## GET /todos

List. Open tickets first, then newest `createdAt`.

| Query | Meaning |
| --- | --- |
| `q` | Case-insensitive match on title, description, or tag |
| `status` | `open` or `done` |
| `priority` | `low`, `medium`, or `high` |

`200` with an array.

## GET /todos/:id

One todo. `200`, `400` if `id` is not an ObjectId, `404` if it is well-formed but missing.

This is the endpoint the ticket page calls after reading `?id=` from the URL.

## PATCH /todos/:id

Partial update. Any subset of:

```json
{
  "title": "Book the later transfer",
  "description": "",
  "completed": true,
  "priority": "low",
  "tags": ["lisbon"],
  "dueAt": null
}
```

`dueAt: null` clears the date. `200`.

## PUT /todos/:id

Same body and behaviour as PATCH. Kept because the assignment sample used PUT.

## DELETE /todos/:id

`204` and an empty body.

## Error shape

Nest’s usual:

```json
{
  "statusCode": 400,
  "message": ["title must be longer than or equal to 1 characters"],
  "error": "Bad Request"
}
```

`message` is a string or an array of strings.
