"""Backend settings, sourced from the repo-root .env (shared with the TS framework)."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# webapp/backend/app/config.py -> parents[3] is the repo root.
REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[1]

# Load the same .env the Playwright framework uses (MONGO_URI, etc.).
load_dotenv(REPO_ROOT / ".env")


class Settings:
    # MongoDB (shared with the TS framework)
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db: str = os.getenv("MONGO_DB", "qa")

    # Collections
    drafts_collection: str = os.getenv("TESTS_COLLECTION", "tests")
    prod_collection: str = os.getenv("PROD_COLLECTION", "tests_production")
    users_collection: str = "users"
    runs_collection: str = "runs"

    # Auth
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-insecure-change-me")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

    # Seeded bootstrap users (created only if the users collection is empty)
    seed_promoter_password: str = os.getenv("SEED_PROMOTER_PASSWORD", "promoter123")
    seed_author_password: str = os.getenv("SEED_AUTHOR_PASSWORD", "author123")

    # CORS / frontend
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # Test execution
    repo_root: Path = REPO_ROOT
    runner_script: Path = BACKEND_ROOT / "run_playwright.sh"
    run_artifacts_dir: Path = BACKEND_ROOT / "run-artifacts"


settings = Settings()
