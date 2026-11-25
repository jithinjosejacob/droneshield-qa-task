from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..db import drafts, production
from ..security import get_current_user, require_role
from ..util import doc_out

router = APIRouter(tags=["promotion"])

promoter_only = require_role("promoter")


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.get("/production", dependencies=[Depends(get_current_user)])
async def list_production() -> list[dict]:
    docs = await production().find().sort("name", 1).to_list(length=None)
    return [doc_out(d) for d in docs]


@router.post("/tests/{test_id}/promote", status_code=status.HTTP_201_CREATED)
async def promote(test_id: str, user: dict = Depends(promoter_only)) -> dict:
    """Snapshot a draft into the production collection (new _id, versioned)."""
    if not ObjectId.is_valid(test_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Draft not found")
    draft = await drafts().find_one({"_id": ObjectId(test_id)})
    if not draft:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Draft not found")

    prior = await production().count_documents({"source_id": str(draft["_id"])})
    snapshot = {k: v for k, v in draft.items() if k != "_id"}
    snapshot.update(
        {
            "source_id": str(draft["_id"]),
            "promoted_by": user["username"],
            "promoted_at": _now(),
            "version": prior + 1,
        }
    )
    result = await production().insert_one(snapshot)
    snapshot["_id"] = result.inserted_id
    return doc_out(snapshot)


@router.delete("/production/{prod_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unpublish(prod_id: str, user: dict = Depends(promoter_only)) -> None:
    if not ObjectId.is_valid(prod_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Production test not found")
    result = await production().delete_one({"_id": ObjectId(prod_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Production test not found")
