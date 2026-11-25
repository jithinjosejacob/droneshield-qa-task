# Test Manager web app

React + FastAPI UI over the MongoDB-driven Playwright framework. Author configurable
test cases, promote them to production, and run them with stored results.

Full documentation: [../docs/EXERCISE-4.md](../docs/EXERCISE-4.md).

## Quick start

Prereqs: local MongoDB running, Node 18 (`nvm use 18`), Python 3.11, and Playwright
browsers (`npx playwright install chromium` from the repo root).

```bash
# Backend  (http://127.0.0.1:8000, Swagger at /docs)
cd webapp/backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (http://localhost:5173)  — new terminal
cd webapp/frontend
npm install
npm run dev
```

Seeded logins (first run): `author / author123`, `promoter / promoter123`.

Config is read from the repo-root `.env` (`MONGO_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`,
seed passwords). Test execution shells out to the repo's Playwright framework, which
needs Node 18 — `run_playwright.sh` handles `nvm use 18`.
