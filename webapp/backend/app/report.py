"""Render a stored run document as a downloadable report (HTML / CSV / JSON)."""
from __future__ import annotations

import csv
import html
import io
import json

from .util import doc_out

STATUS_COLORS = {
    "passed": "#2fbf71",
    "failed": "#e5484d",
    "error": "#e5484d",
    "running": "#f5a524",
    "pending": "#f5a524",
    "skipped": "#9aa3b2",
    "unknown": "#9aa3b2",
}


def _fmt(value) -> str:
    return "" if value is None else str(value)


def to_json(run: dict) -> str:
    return json.dumps(doc_out(run), indent=2, default=str)


def to_csv(run: dict) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["name", "type", "status", "duration_ms", "error"])
    for r in run.get("results", []):
        writer.writerow(
            [
                _fmt(r.get("name")),
                _fmt(r.get("type")),
                _fmt(r.get("status")),
                _fmt(r.get("duration_ms")),
                _fmt(r.get("error")),
            ]
        )
    return buf.getvalue()


def to_html(run: dict) -> str:
    doc = doc_out(run)
    summary = doc.get("summary", {})
    rows = []
    for r in doc.get("results", []):
        status = r.get("status", "unknown")
        color = STATUS_COLORS.get(status, "#9aa3b2")
        rows.append(
            f"""      <tr>
        <td>{html.escape(_fmt(r.get('name')))}</td>
        <td>{html.escape(_fmt(r.get('type')))}</td>
        <td><span class="status" style="background:{color}22;color:{color}">{html.escape(status)}</span></td>
        <td>{html.escape(_fmt(r.get('duration_ms')))}{' ms' if r.get('duration_ms') is not None else ''}</td>
        <td class="err">{html.escape(_fmt(r.get('error')))}</td>
      </tr>"""
        )
    results_html = "\n".join(rows) or '      <tr><td colspan="5">No results.</td></tr>'
    overall = doc.get("status", "unknown")
    overall_color = STATUS_COLORS.get(overall, "#9aa3b2")

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Test run report — {html.escape(str(doc.get('id', '')))}</title>
<style>
  body {{ font: 14px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         color: #1b1f27; background: #f6f7f9; margin: 0; padding: 32px; }}
  .wrap {{ max-width: 920px; margin: 0 auto; }}
  h1 {{ margin: 0 0 4px; }}
  .meta {{ color: #5b6472; margin-bottom: 20px; }}
  .cards {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }}
  .card {{ background: #fff; border: 1px solid #e4e7ec; border-radius: 10px; padding: 12px 16px; }}
  .card b {{ font-size: 20px; }}
  table {{ width: 100%; border-collapse: collapse; background: #fff;
          border: 1px solid #e4e7ec; border-radius: 10px; overflow: hidden; }}
  th, td {{ text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef0f3; vertical-align: top; }}
  th {{ font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #5b6472; }}
  tr:last-child td {{ border-bottom: none; }}
  .status {{ padding: 2px 10px; border-radius: 20px; font-size: 12px; text-transform: uppercase; }}
  .err {{ color: #b4232a; font-size: 12px; white-space: pre-wrap; max-width: 360px; }}
  .badge {{ padding: 3px 12px; border-radius: 20px; font-size: 13px; text-transform: uppercase;
           background: {overall_color}22; color: {overall_color}; }}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Test run report <span class="badge">{html.escape(overall)}</span></h1>
    <div class="meta">
      Source: <b>{html.escape(_fmt(doc.get('source')))}</b> ·
      Triggered by: <b>{html.escape(_fmt(doc.get('triggered_by')))}</b> ·
      Run id: {html.escape(_fmt(doc.get('id')))}
    </div>
    <div class="cards">
      <div class="card">Passed<br><b>{summary.get('passed', 0)}</b></div>
      <div class="card">Failed<br><b>{summary.get('failed', 0)}</b></div>
      <div class="card">Skipped<br><b>{summary.get('skipped', 0)}</b></div>
      <div class="card">Created<br><b>{html.escape(_fmt(doc.get('created_at')))}</b></div>
      <div class="card">Finished<br><b>{html.escape(_fmt(doc.get('finished_at')))}</b></div>
    </div>
    <table>
      <thead><tr><th>Test</th><th>Type</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
      <tbody>
{results_html}
      </tbody>
    </table>
  </div>
</body>
</html>"""


RENDERERS = {
    "json": (to_json, "application/json"),
    "csv": (to_csv, "text/csv"),
    "html": (to_html, "text/html"),
}
