"""FastAPI app: auth, draft CRUD, promotion, user admin, and test execution."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import users
from .routers import auth, promotion, runs, tests, users as users_router
from .security import hash_password


async def bootstrap_users() -> None:
    """Seed one promoter and one author the first time the app starts."""
    if await users().count_documents({}) > 0:
        return
    await users().insert_many(
        [
            {
                "username": "promoter",
                "role": "promoter",
                "hashed_password": hash_password(settings.seed_promoter_password),
            },
            {
                "username": "author",
                "role": "author",
                "hashed_password": hash_password(settings.seed_author_password),
            },
        ]
    )
    print("Seeded users: promoter / author (passwords from env or defaults)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.run_artifacts_dir.mkdir(parents=True, exist_ok=True)
    await bootstrap_users()
    yield


app = FastAPI(title="DroneShield Test Manager", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tests.router)
app.include_router(promotion.router)
app.include_router(runs.router)
app.include_router(users_router.router)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok"}
