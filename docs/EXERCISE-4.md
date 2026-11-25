# EXERCISE-4 — Web app to author, promote & run test cases

A React + FastAPI web layer over the existing MongoDB-driven Playwright framework.
Non-CLI users can **author** configurable test cases, **promote** approved ones to
production, and **execute** them with results — behind real user accounts.

## Architecture

```
React (Vite+TS)  ──HTTP/JWT──>  FastAPI  ──Motor──>  MongoDB (same instance)
  webapp/frontend                webapp/backend        tests / tests_production
                                     │                  users / runs
                                     │ subprocess (Node 18)
                                     ▼
                          existing Playwright framework
                          (scripts/fetchTests.ts + configs + engine)
```

The backend shares one MongoDB with the Playwright framework. To run tests it spawns
the existing framework as a subprocess, so there is a single execution path.

## Roles

| Action | author | promoter |
|---|---|---|
| Create / edit / delete draft tests | ✅ | ✅ |
| Run tests, view run history | ✅ | ✅ |
| Promote a draft → production | ❌ | ✅ |
| Unpublish a production test | ❌ | ✅ |
| Manage users / roles | ❌ | ✅ |

Seeded on first run: `author / author123` and `promoter / promoter123` (override with
`SEED_AUTHOR_PASSWORD` / `SEED_PROMOTER_PASSWORD`).

## Collections

- `tests` — drafts (authored here; also what the CLI `enabled` runs use).
- `tests_production` — promotion **snapshots** (`source_id`, `promoted_by`,
  `promoted_at`, `version`). Promotion copies, so editing a draft never changes
  production. Playwright runs against it via `TESTS_COLLECTION=tests_production`.
- `users` — `{ username, role, hashed_password }` (bcrypt).
- `runs` — one document per execution: status, summary, per-test results, who/when.

## Promotion workflow

1. An **author** builds a test in the guided step builder and saves it (a draft).
2. They **Run** it from the UI to confirm it passes.
3. A **promoter** reviews and clicks **Promote** → a versioned snapshot lands in
   `tests_production`.
4. Either role can **Run** production tests; results are stored in `runs`.

## Execution

`POST /runs {source, test_ids}` creates a `pending` run and a background task. The
task writes `TEST_IDS` + the source collection into the environment and runs the
existing framework for each test type:

```
npm run fetch:<type>        # writes .generated/<type>.tests.json (selected subset)
npx playwright test --config=config/playwright.<type>.config.ts --reporter=json
```

The JSON report is parsed, each spec mapped back to its test id, and the `runs`
document updated (`passed`/`failed`/`error` + per-test status, duration, error). The
UI polls `GET /runs/{id}` and updates live. Runs are serialised (they share the repo's
`.generated` cache). Node 18 is required — the wrapper
`webapp/backend/run_playwright.sh` does `nvm use 18` (the machine default is v15).

The only change to the framework is a `TEST_IDS` filter in
[scripts/fetchTests.ts](../scripts/fetchTests.ts) /
[db/testRepository.ts](../db/testRepository.ts) so a selected subset can run; CLI
behaviour is unchanged when `TEST_IDS` is unset.

## Running it

Prereqs: local MongoDB, Node 18 (`nvm use 18`), Playwright browsers
(`npx playwright install chromium`), Python 3.11.

**1. Seed the framework's starter tests (optional):**
```
npm run seed
```

**2. Backend:**
```
cd webapp/backend
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000      # Swagger at http://127.0.0.1:8000/docs
```

**3. Frontend (Node 18):**
```
cd webapp/frontend
npm install
npm run dev                                     # http://localhost:5173
```

Log in as `author` to build/run tests, or `promoter` to promote and manage users.

## API surface

- `POST /auth/login`, `GET /auth/me`
- `GET/POST /tests`, `GET/PUT/DELETE /tests/{id}`
- `POST /tests/{id}/promote`, `GET /production`, `DELETE /production/{id}`
- `POST /runs`, `GET /runs`, `GET /runs/{id}`
- `GET/POST /users`, `PUT /users/{id}/role`, `DELETE /users/{id}` (promoter only)

## Notes / follow-ups

- Secrets stay in `.env` as `env:NAME` placeholders in test values — never stored
  literally in the DB.
- Test documents are validated server-side by Pydantic models mirroring
  [types/testSchema.ts](../types/testSchema.ts) (bad builder output → HTTP 422).
- Promoter doubles as user admin (no separate `admin` role) — easily split later.
- Per-run HTML report serving and a worker queue for parallel runs are natural next
  steps; v1 stores structured results and runs serially.
