"""Executes a selected subset of tests by driving the existing Playwright framework.

Flow per run:
  1. Load the selected docs from the source collection (to know type + title).
  2. Group by type; for each type run run_playwright.sh with TEST_IDS + the right
     source collection, producing a JSON report.
  3. Parse the JSON, map each spec back to its test_id, persist results on the run.

Runs are serialised with a lock because they share the repo's .generated/* cache.
"""
from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId

from .config import settings
from .db import collection_for, collection_name_for, runs

_run_lock = asyncio.Lock()

CONFIG_FOR = {
    "ui": "config/playwright.ui.config.ts",
    "api": "config/playwright.api.config.ts",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _expected_title(doc: dict) -> str:
    """Reproduce the title the dynamic runner gives a test (name + tag suffix)."""
    tags = doc.get("tags") or []
    return f"{doc['name']} [{', '.join(tags)}]" if tags else doc["name"]


def _collect_specs(node: dict, acc: list[dict]) -> None:
    """Walk the Playwright JSON suite tree, collecting all specs."""
    for spec in node.get("specs", []):
        acc.append(spec)
    for child in node.get("suites", []):
        _collect_specs(child, acc)


def _spec_status(spec: dict) -> tuple[str, int, str | None]:
    """Reduce a spec's test results to (status, duration_ms, error)."""
    status = "unknown"
    duration = 0
    error = None
    for test in spec.get("tests", []):
        for result in test.get("results", []):
            duration = max(duration, int(result.get("duration", 0)))
            if result.get("status") in ("failed", "timedOut", "interrupted"):
                status = "failed"
                err = result.get("error") or {}
                error = err.get("message") or err.get("stack")
            elif result.get("status") == "skipped" and status == "unknown":
                status = "skipped"
            elif result.get("status") == "passed" and status in ("unknown", "skipped"):
                status = "passed"
    return status, duration, error


async def _run_group(type_: str, ids: list[str], source: str, run_id: str) -> list[dict]:
    """Run one type's subset and return parsed per-spec outcomes keyed by title."""
    json_out = settings.run_artifacts_dir / run_id / f"{type_}.json"
    json_out.parent.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env.update(
        {
            "REPO_ROOT": str(settings.repo_root),
            "MONGO_URI": settings.mongo_uri,
            "MONGO_DB": settings.mongo_db,
            "TESTS_COLLECTION": collection_name_for(source),
            "TEST_IDS": ",".join(ids),
        }
    )

    proc = await asyncio.create_subprocess_exec(
        "bash",
        str(settings.runner_script),
        type_,
        CONFIG_FOR[type_],
        str(json_out),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if not json_out.exists():
        raise RuntimeError(
            f"{type_} run produced no report. "
            f"stderr: {stderr.decode('utf-8', 'replace')[-2000:]}"
        )

    report = json.loads(json_out.read_text())
    specs: list[dict] = []
    for suite in report.get("suites", []):
        _collect_specs(suite, specs)

    by_title: dict[str, tuple[str, int, str | None]] = {}
    for spec in specs:
        by_title[spec.get("title", "")] = _spec_status(spec)
    return by_title


async def execute_run(run_id: str, source: str, test_ids: list[str]) -> None:
    """Background entrypoint: run the selected tests and persist results."""
    async with _run_lock:
        await runs().update_one(
            {"_id": ObjectId(run_id)},
            {"$set": {"status": "running", "started_at": _now()}},
        )

        object_ids = [ObjectId(t) for t in test_ids if ObjectId.is_valid(t)]
        docs = await collection_for(source).find({"_id": {"$in": object_ids}}).to_list(length=None)

        groups: dict[str, list[dict]] = {}
        for doc in docs:
            groups.setdefault(doc.get("type", "ui"), []).append(doc)

        results: list[dict] = []
        overall = "passed"
        try:
            for type_, group_docs in groups.items():
                ids = [str(d["_id"]) for d in group_docs]
                by_title = await _run_group(type_, ids, source, run_id)
                for doc in group_docs:
                    status, duration, error = by_title.get(
                        _expected_title(doc), ("unknown", 0, "test did not run")
                    )
                    if status in ("failed", "unknown"):
                        overall = "failed"
                    results.append(
                        {
                            "test_id": str(doc["_id"]),
                            "name": doc["name"],
                            "type": type_,
                            "status": status,
                            "duration_ms": duration,
                            "error": error,
                        }
                    )
            status = overall
        except Exception as exc:  # noqa: BLE001 - surface any failure to the UI
            status = "error"
            results.append({"test_id": None, "name": "runner", "status": "error", "error": str(exc)})

        summary = {
            "passed": sum(1 for r in results if r.get("status") == "passed"),
            "failed": sum(1 for r in results if r.get("status") == "failed"),
            "skipped": sum(1 for r in results if r.get("status") == "skipped"),
        }
        await runs().update_one(
            {"_id": ObjectId(run_id)},
            {
                "$set": {
                    "status": status,
                    "results": results,
                    "summary": summary,
                    "finished_at": _now(),
                }
            },
        )
