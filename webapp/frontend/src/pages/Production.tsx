import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRun, listProduction, unpublish } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { TestDoc } from '../types';

export default function Production() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestDoc[]>([]);

  async function load() {
    setTests(await listProduction());
  }
  useEffect(() => {
    load();
  }, []);

  async function run(t: TestDoc) {
    const r = await createRun('production', [t.id]);
    navigate(`/runs/${r.id}`);
  }

  async function runAll() {
    const r = await createRun('production', tests.map((t) => t.id));
    navigate(`/runs/${r.id}`);
  }

  async function remove(t: TestDoc) {
    if (!confirm(`Unpublish "${t.name}" (v${t.version}) from production?`)) return;
    await unpublish(t.id);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Production test cases</h2>
        <button
          className="btn"
          onClick={runAll}
          disabled={tests.length === 0}
          title={tests.length === 0 ? 'Nothing in production to run' : 'Run all production tests'}
        >
          ▶ Run all ({tests.length})
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Version</th>
            <th>Promoted by</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>
                <span className={`pill pill-${t.type}`}>{t.type}</span>
              </td>
              <td>v{t.version}</td>
              <td>{t.promoted_by}</td>
              <td className="actions">
                <button className="btn" onClick={() => run(t)}>
                  Run
                </button>
                {user?.role === 'promoter' && (
                  <button className="btn danger" onClick={() => remove(t)}>
                    Unpublish
                  </button>
                )}
              </td>
            </tr>
          ))}
          {tests.length === 0 && (
            <tr>
              <td colSpan={5} className="muted center">
                Nothing in production yet. Promote a draft from the Drafts page.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
