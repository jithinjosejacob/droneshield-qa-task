"""Small helpers for serialising Mongo documents to JSON-friendly dicts."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId


def jsonable(value: Any) -> Any:
    """Recursively convert ObjectId/datetime so FastAPI can serialise the value."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: jsonable(v) for k, v in value.items()}
    return value


def doc_out(doc: dict | None) -> dict | None:
    """Serialise a Mongo doc, renaming _id -> id."""
    if doc is None:
        return None
    out = jsonable(doc)
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out
