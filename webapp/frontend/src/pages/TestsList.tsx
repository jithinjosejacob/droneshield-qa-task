import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRun, deleteTest, listTests, promoteTest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { TestDoc } from '../types';

export default function TestsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestDoc[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [msg, setMsg] = useState('');

  async function load() {
    setTests(await listTests(filter || undefined));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function run(t: TestDoc) {
    const r = await createRun('draft', [t.id]);
    navigate(`/runs/${r.id}`);
  }

  const enabledTests = tests.filter((t) => t.enabled);
  async function runAll() {
    const r = await createRun('draft', enabledTests.map((t) => t.id));
    navigate(`/runs/${r.id}`);
  }

  async function promote(t: TestDoc) {
    await promoteTest(t.id);
    setMsg(`Promoted "${t.name}" to production.`);
  }

  async function remove(t: TestDoc) {
    if (!confirm(`Delete draft "${t.name}"?`)) return;
    await deleteTest(t.id);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Draft test cases</h2>
        <div className="row gap">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="ui">UI</option>
            <option value="api">API</option>
          </select>
          <button
            className="btn"
            onClick={runAll}
            disabled={enabledTests.length === 0}
            title={enabledTests.length === 0 ? 'No enabled tests to run' : 'Run all enabled tests'}
          >
            ▶ Run all ({enabledTests.length})
          </button>
          <Link className="btn primary" to="/tests/new">
            + New test
          </Link>
        </div>
      </div>
      {msg && <div className="banner">{msg}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Tags</th>
            <th>Enabled</th>
            <th>Steps/Asserts</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t) => (
            <tr key={t.id}>
              <td>
                <Link to={`/tests/${t.id}`}>{t.name}</Link>
              </td>
              <td>
                <span className={`pill pill-${t.type}`}>{t.type}</span>
              </td>
              <td>{(t.tags || []).join(', ')}</td>
              <td>{t.enabled ? '✓' : '—'}</td>
              <td>{t.type === 'ui' ? t.steps?.length : t.assertions?.length}</td>
              <td className="actions">
                <button className="btn" onClick={() => run(t)}>
                  Run
                </button>
                <Link className="btn ghost" to={`/tests/${t.id}`}>
                  Edit
                </Link>
                {user?.role === 'promoter' && (
                  <button className="btn ok" onClick={() => promote(t)}>
                    Promote
                  </button>
                )}
                <button className="btn danger" onClick={() => remove(t)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {tests.length === 0 && (
            <tr>
              <td colSpan={6} className="muted center">
                No draft tests yet. Create one with “+ New test”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
