# Architecture

## Why this is an MPA

The brief asks for a multiple-page application, not an SPA.

A Vite + React Router setup would still be one JavaScript application swapping views. That is multiple *routes*, not multiple *pages*.

This repo does the boring, honest version:

```
frontend/
  index.html          → src/pages/list/main.tsx
  todo.html           → src/pages/todo/main.tsx
```

Vite is configured with two Rollup inputs. Each HTML file loads its own bundle. Moving from the list to a ticket is `<a href="/todo.html?id=…">`. The browser requests a new document. React boots again on that document and reads `URLSearchParams`.

Shared code (API client, types, CSS) is imported by both entries. Sharing modules does not make it an SPA; the navigation still crosses documents.

The colophon on the page says as much, in case anyone opens the UI and wonders.

## Request path

```
browser
  index.html | todo.html
       │
       │  fetch
       ▼
Nest  /api/todos
       │
       ▼
Mongo  todos collection
```

CORS on the API allows `localhost` / `127.0.0.1` with any port, so Vite can sit on 5173.

## API layout

```
backend/src
  main.ts                 dotenv, global prefix, CORS, ValidationPipe
  app.module.ts           Mongoose + TodosModule
  todos/
    todos.module.ts
    todos.controller.ts   HTTP only
    todos.service.ts      queries, mapping, empty-collection seed
    todos.controller.spec.ts
    todos.service.spec.ts
    todo.constants.ts
    todo.view.ts          Mongo document → public JSON
    schemas/todo.schema.ts
    dto/
      create-todo.dto.ts
      update-todo.dto.ts
      list-todos.query.ts
```

The controller does not talk to Mongoose. The service never sets status codes; it throws `BadRequestException` / `NotFoundException` and lets Nest translate.

`_id` is mapped to `id` in `todo.view.ts` so the frontend never sees Mongo’s shape.

## Frontend layout

```
frontend/src
  pages/list/     list entry + ListPage
  pages/todo/     ticket entry + DetailPage
  shared/         fetch wrapper, dates, CSS, shell
```

No page component imports the other page.

## Persistence

Mongoose schema with `timestamps: true`. Compound index on `{ completed, createdAt }`. Tags stay as a string array. Search is a case-insensitive regex across title, description, and tags so a local Mongo 7 works without Atlas search.

## What I left out on purpose

- A repository interface over Mongoose — one collection, one service is enough
- Redux / React Query — two pages, a handful of fetches
- Auth — not in the brief
- Pagination — the seed is four rows and this is a take-home, not a sync engine
