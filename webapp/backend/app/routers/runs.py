import asyncio
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from ..db import runs
from ..report import RENDERERS
from ..runner import execute_run
from ..schemas import RunCreate
from ..security import get_current_user
from ..util import doc_out

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_run(body: RunCreate, user: dict = Depends(get_current_user)) -> dict:
    doc = {
        "source": body.source,
        "test_ids": body.test_ids,
        "status": "pending",
        "summary": {"passed": 0, "failed": 0, "skipped": 0},
        "results": [],
        "triggered_by": user["username"],
        "created_at": datetime.now(timezone.utc),
        "started_at": None,
        "finished_at": None,
    }
    result = await runs().insert_one(doc)
    run_id = str(result.inserted_id)
    # Fire-and-forget; the UI polls GET /runs/{id} for progress.
    asyncio.create_task(execute_run(run_id, body.source, body.test_ids))
    doc["_id"] = result.inserted_id
    return doc_out(doc)


@router.get("", dependencies=[Depends(get_current_user)])
async def list_runs(limit: int = 50) -> list[dict]:
    docs = await runs().find().sort("created_at", -1).limit(limit).to_list(length=limit)
    return [doc_out(d) for d in docs]


@router.get("/{run_id}", dependencies=[Depends(get_current_user)])
async def get_run(run_id: str) -> dict:
    if not ObjectId.is_valid(run_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Run not found")
    doc = await runs().find_one({"_id": ObjectId(run_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Run not found")
    return doc_out(doc)


@router.get("/{run_id}/report", dependencies=[Depends(get_current_user)])
async def download_report(run_id: str, format: str = "html") -> Response:
    if format not in RENDERERS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "format must be html, csv or json")
    if not ObjectId.is_valid(run_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Run not found")
    doc = await runs().find_one({"_id": ObjectId(run_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Run not found")

    render, content_type = RENDERERS[format]
    body = render(doc)
    filename = f"run-{run_id}.{format}"
    return Response(
        content=body,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
