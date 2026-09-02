# Ziptrrip Todo

A two-page todo app for the Ziptrrip assignment.

The frontend is a real multi-page app: `index.html` is the list, `todo.html` is a single ticket. Clicking a title does a full navigation to `/todo.html?id=…`. There is no React Router and no shared client-side history.

The API is NestJS. Todos live in MongoDB.

## Stack

| Layer | Choice |
| --- | --- |
| Web | React 19, TypeScript, Vite (two HTML entry points) |
| API | NestJS 11, TypeScript |
| Data | MongoDB via Mongoose |
| Tests | Jest + Supertest |
| API scratch files | Postman collection + `api/todos.http` |

## Pages

- List: [http://localhost:5173/](http://localhost:5173/)
- Ticket: [http://localhost:5173/todo.html?id=\<mongoObjectId\>](http://localhost:5173/todo.html?id=)

The query parameter name is `id`, as the brief asked for.

## Run it

Mongo needs to be up first. Either:

```bash
docker compose up -d
```

or a local `mongod` already listening on `27017` (Homebrew install is fine).

API:

```bash
cd backend
cp .env.example .env   # already matches local Docker
npm install
npm run start:dev
```

Listens on `http://localhost:3000`. Global prefix is `/api`.

Web:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite serves on `http://localhost:5173`.

An empty database gets four sample tickets on first boot so the list is not a blank page.

## Tests

```bash
cd backend
npm test
npm run test:e2e
```

Unit tests sit next to the service and controller. The e2e file hits the HTTP layer with the service mocked — it checks validation and status codes without needing Mongo.

## Docs in this repo

- [FEATURES.md](FEATURES.md) — what the product actually does
- [docs/API.md](docs/API.md) — request/response contract
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — MPA setup, folders, why these choices
- [postman/Ziptrrip-Todo-API.postman_collection.json](postman/Ziptrrip-Todo-API.postman_collection.json)
- [api/todos.http](api/todos.http) — VS Code REST Client

Undocumented behaviour is not part of the submission. If it is not in FEATURES.md, treat it as accidental.

## Env

`backend/.env.example`

```
MONGODB_URI=mongodb://127.0.0.1:27017/ziptrrip
PORT=3000
```

`frontend/.env.example`

```
VITE_API_URL=http://localhost:3000/api
```

Do not put Atlas passwords in git.
