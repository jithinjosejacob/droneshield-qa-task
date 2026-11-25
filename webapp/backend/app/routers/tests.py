from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from ..db import drafts
from ..schemas import TestIn
from ..security import get_current_user, require_role
from ..util import doc_out

router = APIRouter(prefix="/tests", tags=["tests"])

# Any authenticated role may author drafts.
author_or_promoter = require_role("author", "promoter")


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.get("", dependencies=[Depends(get_current_user)])
async def list_tests(type: str | None = Query(default=None)) -> list[dict]:
    query: dict = {}
    if type in ("ui", "api"):
        query["type"] = type
    docs = await drafts().find(query).sort("name", 1).to_list(length=None)
    return [doc_out(d) for d in docs]


@router.get("/{test_id}", dependencies=[Depends(get_current_user)])
async def get_test(test_id: str) -> dict:
    if not ObjectId.is_valid(test_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test not found")
    doc = await drafts().find_one({"_id": ObjectId(test_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test not found")
    return doc_out(doc)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_test(
    body: TestIn = Body(...),
    user: dict = Depends(author_or_promoter),
) -> dict:
    doc = body.model_dump()
    doc.update(
        {
            "created_by": user["username"],
            "created_at": _now(),
            "updated_at": _now(),
        }
    )
    result = await drafts().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_out(doc)


@router.put("/{test_id}")
async def update_test(
    test_id: str,
    body: TestIn = Body(...),
    user: dict = Depends(author_or_promoter),
) -> dict:
    if not ObjectId.is_valid(test_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test not found")
    update = body.model_dump()
    update["updated_at"] = _now()
    result = await drafts().find_one_and_update(
        {"_id": ObjectId(test_id)},
        {"$set": update},
        return_document=True,
    )
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test not found")
    return doc_out(result)


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(test_id: str, user: dict = Depends(author_or_promoter)) -> None:
    if not ObjectId.is_valid(test_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test not found")
    result = await drafts().delete_one({"_id": ObjectId(test_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test not found")
