"""Async MongoDB access via Motor. Shares the database with the TS framework."""
from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase

from .config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongo_db]


def drafts() -> AsyncIOMotorCollection:
    return get_db()[settings.drafts_collection]


def production() -> AsyncIOMotorCollection:
    return get_db()[settings.prod_collection]


def users() -> AsyncIOMotorCollection:
    return get_db()[settings.users_collection]


def runs() -> AsyncIOMotorCollection:
    return get_db()[settings.runs_collection]


def collection_for(source: str) -> AsyncIOMotorCollection:
    """'draft' -> drafts collection, 'production' -> production collection."""
    return production() if source == "production" else drafts()


def collection_name_for(source: str) -> str:
    return settings.prod_collection if source == "production" else settings.drafts_collection
