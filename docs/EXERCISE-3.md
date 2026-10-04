# EXERCISE-3 — Dynamic, DB-driven tests (MongoDB)

## Goal

Tests should be **added dynamically** and **read from a database when the suite is
invoked**, then executed. Adding a test becomes a single MongoDB insert — no code
change, no redeploy.

## How it works

```
npm run ui-test
  1. tsx scripts/fetchTests.ts ui   -> connect to MONGO_URI, read enabled UI docs,
                                       write .generated/ui.tests.json
  2. playwright test (ui config)    -> tests/uitests/dynamic.spec.ts reads that JSON
                                       and emits one test() per document, run by the
                                       generic UI step interpreter.
```

The API suite is identical (`fetch:api` -> `.generated/api.tests.json` ->
`tests/apitests/dynamic.spec.ts` -> API interpreter).

### Why fetch runs *before* Playwright

Playwright discovers tests by importing spec files **synchronously** at collection
time, but the MongoDB driver is **async**. Fetching inside a spec (or relying on
`globalSetup` ordering) is therefore unreliable. Instead the npm script fetches to a
local JSON cache first (`npm run fetch:* && playwright test ...`); the runner spec then
reads that cache synchronously. If the fetch fails (bad `MONGO_URI`, validation error)
it exits non-zero and the chained `&&` halts the whole run.

## Document schema (`tests` collection, discriminated by `type`)

```jsonc
// UI test — an ordered list of constrained actions
{ "type": "ui", "name": "Add Sauce Labs Backpack to cart", "enabled": true,
  "tags": ["smoke", "cart"],
  "steps": [
    { "action": "goto",  "target": "env:BASE_URL" },
    { "action": "fill",  "selector": "#user-name", "value": "env:SAUCEDEMO_USERNAME" },
    { "action": "fill",  "selector": "#password",  "value": "env:SAUCEDEMO_PASSWORD" },
    { "action": "click", "selector": "#login-button" },
    { "action": "click", "selector": "#add-to-cart-sauce-labs-backpack" },
    { "action": "click", "selector": "[data-test=\"shopping-cart-link\"]" },
    { "action": "expectVisible", "selector": "[data-test=\"checkout\"]" }
  ] }

// API test — one request + a list of assertions
{ "type": "api", "name": "Available pets return 200", "enabled": true, "tags": ["smoke"],
  "request": { "method": "get", "url": "env:API_URL/pet/findByStatus?status=available" },
  "assertions": [ { "type": "expectOk" } ] }
```

### Secrets and environment values

Documents never store secrets or environment-specific URLs. They store **placeholders**
like `env:SAUCEDEMO_USERNAME` or `env:API_URL`, which the engine resolves from `.env`
at execution time (see [engine/resolve.ts](../engine/resolve.ts)).

### Safety

The engine is a **constrained interpreter**, not an evaluator. Only the enumerated
actions/assertions below are honoured; an unknown one is an explicit, hard failure. No
arbitrary code is ever stored in the DB or executed.

## Supported actions

- **UI steps:** `goto`, `fill`, `type`, `click`, `check`, `selectOption`, `press`,
  `waitFor`, `expectVisible`, `expectHidden`, `expectText`, `expectUrl`.
  Selectors are passed straight to `page.locator(...)`, so CSS and `data-test=` both work.
- **API assertions:** `expectOk`, `expectStatus` (code), `expectBodyContains`,
  `expectJsonPath` (dotted path equals value).

Both sets are small on purpose and easy to extend in
[engine/uiExecutor.ts](../engine/uiExecutor.ts) /
[engine/apiExecutor.ts](../engine/apiExecutor.ts).

## Adding a test (no code change)

Insert a document into the `tests` collection, e.g.:

```js
db.tests.insertOne({
  type: "api",
  name: "Sold pets return 200",
  enabled: true,
  tags: ["regression"],
  request: { method: "get", url: "env:API_URL/pet/findByStatus?status=sold" },
  assertions: [{ type: "expectStatus", code: 200 }]
})
```

Re-run `npm run api-test` — the new test is fetched and executed automatically. Set
`enabled: false` to park a test without deleting it.

## Environment (.env)

```
MONGO_URI=mongodb://...        # external Mongo (Atlas or local)
MONGO_DB=qa
TESTS_COLLECTION=tests
BASE_URL=https://www.saucedemo.com/
API_URL=http://petstore.swagger.io/v2
SAUCEDEMO_USERNAME=...
SAUCEDEMO_PASSWORD=...
```

## Layout

- [db/mongoClient.ts](../db/mongoClient.ts) — connection from `MONGO_URI`.
- [db/testRepository.ts](../db/testRepository.ts) — `fetchTests(type)` over `{ enabled: true }`.
- [types/testSchema.ts](../types/testSchema.ts) — document/step/assertion types.
- [engine/](../engine/) — `resolve`, `uiExecutor`, `apiExecutor`, `loadGenerated`, `paths`.
- [scripts/fetchTests.ts](../scripts/fetchTests.ts) — the pre-run fetch step.
- [scripts/seedTests.ts](../scripts/seedTests.ts) — seeds the two migrated starter tests.
- [tests/uitests/dynamic.spec.ts](../tests/uitests/dynamic.spec.ts) /
  [tests/apitests/dynamic.spec.ts](../tests/apitests/dynamic.spec.ts) — the runners.

The original static specs (`TC101_*`, `TC201_*`, `TC202_*`) are kept for reference;
`testMatch: '**/dynamic.spec.ts'` in the Playwright configs ensures only the dynamic
runners execute.
