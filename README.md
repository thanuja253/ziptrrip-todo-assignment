# Ziptrrip Todo

Todo app for the Ziptrrip assignment. React + TypeScript on the front, NestJS API, MongoDB.

There are two pages:

- list — `http://localhost:5173/`
- one todo — `http://localhost:5173/todo.html?id=<id>`

`id` is a query param, not part of the path. Clicking a title loads `todo.html` as a new page. I didn't put React Router in here on purpose.

Full feature list is in [FEATURES.md](FEATURES.md). API shapes are in [docs/API.md](docs/API.md). Folder layout and why the two HTML files exist is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## What you need

- Node 20
- Mongo on `27017`

If Mongo isn't already running:

```bash
docker compose up -d
```

Homebrew `mongod` on the default port is also fine. I used that locally.

## Run the API first

The UI calls `http://localhost:3000/api`. If this isn't up, the list page will error.

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Leave that terminal open. First boot against an empty database inserts a few sample todos.

`.env` is just:

```
MONGODB_URI=mongodb://127.0.0.1:27017/ziptrrip
PORT=3000
```

Don't commit real Atlas passwords.

## Then run the UI

The `frontend` folder is the React app. You don't need to know Vite for this — `npm run dev` starts a local site and prints a URL. Open that. It's usually `http://localhost:5173`.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`frontend/.env` tells the React app where the API is:

```
VITE_API_URL=http://localhost:3000/api
```

Leave it unless you changed the API port. The `VITE_` prefix is required by the frontend tooling; if you rename the variable, the app won't pick it up.

## Quick check

1. List page loads sample todos.
2. Add one from the form at the top.
3. Tick the checkbox — it should go to done.
4. Click a title — URL becomes `/todo.html?id=...` and you get the full record.
5. Edit, save, go back. Delete uses an in-app confirm, not the browser popup.

## Tests

From `backend/`:

```bash
npm test
npm run test:e2e
```

`npm test` is the service/controller unit tests. `test:e2e` hits the HTTP routes with the service mocked, so Mongo isn't required for that.

## Calling the API directly

- Postman: `postman/Ziptrrip-Todo-API.postman_collection.json`
- VS Code REST Client: `api/todos.http`

Same CRUD as the UI: create, list, get one, patch, delete.
