import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadRunReport, getRun, listRuns } from '../api/client';
import type { Run } from '../types';

function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

export default function Runs() {
  const { id } = useParams();
  return id ? <RunDetail id={id} /> : <RunList />;
}

function RunList() {
  const [runs, setRuns] = useState<Run[]>([]);
  useEffect(() => {
    listRuns().then(setRuns);
  }, []);
  return (
    <div>
      <div className="page-head">
        <h2>Run history</h2>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Source</th>
            <th>Status</th>
            <th>Pass/Fail/Skip</th>
            <th>By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>
                <span className="pill">{r.source}</span>
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td>
                {r.summary.passed}/{r.summary.failed}/{r.summary.skipped}
              </td>
              <td>{r.triggered_by}</td>
              <td>
                <Link className="btn ghost" to={`/runs/${r.id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
          {runs.length === 0 && (
            <tr>
              <td colSpan={6} className="muted center">
                No runs yet. Trigger one from the Drafts or Production page.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RunDetail({ id }: { id: string }) {
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    async function poll() {
      const r = await getRun(id);
      if (!active) return;
      setRun(r);
      if (r.status === 'pending' || r.status === 'running') {
        timer = window.setTimeout(poll, 1500);
      }
    }
    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (!run) return <div className="center">Loading…</div>;

  const terminal = ['passed', 'failed', 'error'].includes(run.status);

  return (
    <div>
      <div className="page-head">
        <h2>
          Run <StatusBadge status={run.status} />
        </h2>
        <div className="row gap">
          <div className="btn-group" title={terminal ? 'Download report' : 'Available when the run finishes'}>
            <span className="btn-group-label">Download</span>
            <button className="btn ghost" disabled={!terminal} onClick={() => downloadRunReport(run.id, 'html')}>
              HTML
            </button>
            <button className="btn ghost" disabled={!terminal} onClick={() => downloadRunReport(run.id, 'csv')}>
              CSV
            </button>
            <button className="btn ghost" disabled={!terminal} onClick={() => downloadRunReport(run.id, 'json')}>
              JSON
            </button>
          </div>
          <Link className="btn ghost" to="/runs">
            ← All runs
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="row gap wrap">
          <div>
            <span className="muted small">Source</span>
            <div>{run.source}</div>
          </div>
          <div>
            <span className="muted small">Triggered by</span>
            <div>{run.triggered_by}</div>
          </div>
          <div>
            <span className="muted small">Summary</span>
            <div>
              {run.summary.passed} passed · {run.summary.failed} failed · {run.summary.skipped} skipped
            </div>
          </div>
        </div>
        {(run.status === 'pending' || run.status === 'running') && (
          <div className="banner">Running… this view updates automatically.</div>
        )}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Type</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {run.results.map((res, i) => (
            <tr key={i}>
              <td>{res.name}</td>
              <td>{res.type || '—'}</td>
              <td>
                <StatusBadge status={res.status} />
              </td>
              <td>{res.duration_ms ? `${res.duration_ms} ms` : '—'}</td>
              <td className="err">{res.error || ''}</td>
            </tr>
          ))}
          {run.results.length === 0 && (
            <tr>
              <td colSpan={5} className="muted center">
                No results yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
