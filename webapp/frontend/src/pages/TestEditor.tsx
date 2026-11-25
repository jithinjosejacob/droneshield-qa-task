import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTest, getTest, updateTest } from '../api/client';
import type { ApiAssertion, TestType, UiStep } from '../types';

// Which fields each UI action needs — drives the guided inputs.
const UI_ACTION_FIELDS: Record<string, Array<keyof UiStep>> = {
  goto: ['target'],
  fill: ['selector', 'value'],
  type: ['selector', 'value'],
  click: ['selector'],
  check: ['selector'],
  selectOption: ['selector', 'value'],
  press: ['selector', 'key'],
  waitFor: ['selector', 'timeout'],
  expectVisible: ['selector'],
  expectHidden: ['selector'],
  expectText: ['selector', 'value'],
  expectUrl: ['value'],
};
const UI_ACTIONS = Object.keys(UI_ACTION_FIELDS);

const ASSERTION_FIELDS: Record<string, string[]> = {
  expectOk: [],
  expectStatus: ['code'],
  expectBodyContains: ['value'],
  expectJsonPath: ['path', 'value'],
};
const ASSERTIONS = Object.keys(ASSERTION_FIELDS);
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head'];

interface KV {
  k: string;
  v: string;
}

export default function TestEditor() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [type, setType] = useState<TestType>('ui');
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');

  // UI
  const [steps, setSteps] = useState<UiStep[]>([{ action: 'goto', target: 'env:BASE_URL' }]);
  // API
  const [method, setMethod] = useState('get');
  const [url, setUrl] = useState('env:API_URL/');
  const [headers, setHeaders] = useState<KV[]>([]);
  const [params, setParams] = useState<KV[]>([]);
  const [body, setBody] = useState('');
  const [assertions, setAssertions] = useState<ApiAssertion[]>([{ type: 'expectOk' }]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const t = await getTest(id);
      setType(t.type);
      setName(t.name);
      setTags((t.tags || []).join(', '));
      setEnabled(t.enabled);
      if (t.type === 'ui') setSteps(t.steps || []);
      if (t.type === 'api' && t.request) {
        setMethod(t.request.method);
        setUrl(t.request.url);
        setHeaders(Object.entries(t.request.headers || {}).map(([k, v]) => ({ k, v: String(v) })));
        setParams(Object.entries(t.request.params || {}).map(([k, v]) => ({ k, v: String(v) })));
        setBody(t.request.body ? JSON.stringify(t.request.body, null, 2) : '');
        setAssertions(t.assertions || [{ type: 'expectOk' }]);
      }
    })();
  }, [id]);

  // --- UI step editing ---
  function updateStep(i: number, patch: Partial<UiStep>) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  }
  function changeAction(i: number, action: string) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { action } : st)));
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  const addStep = () => setSteps((s) => [...s, { action: 'click' }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  // --- assertion editing ---
  function updateAssertion(i: number, patch: Partial<ApiAssertion>) {
    setAssertions((a) => a.map((as, idx) => (idx === i ? { ...as, ...patch } : as)));
  }
  function changeAssertion(i: number, t: string) {
    setAssertions((a) => a.map((as, idx) => (idx === i ? { type: t } : as)));
  }
  const addAssertion = () => setAssertions((a) => [...a, { type: 'expectOk' }]);
  const removeAssertion = (i: number) => setAssertions((a) => a.filter((_, idx) => idx !== i));

  function buildPayload() {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (type === 'ui') {
      const cleanSteps = steps.map((st) => {
        const out: Record<string, unknown> = { action: st.action };
        for (const f of UI_ACTION_FIELDS[st.action] || []) {
          const val = st[f];
          if (val !== undefined && val !== '') {
            out[f] = f === 'timeout' ? Number(val) : val;
          }
        }
        return out as unknown as UiStep;
      });
      return { type, name, enabled, tags: tagList, steps: cleanSteps };
    }
    const toObj = (kv: KV[]) =>
      kv.filter((x) => x.k).reduce<Record<string, string>>((o, x) => ((o[x.k] = x.v), o), {});
    let parsedBody: unknown = undefined;
    if (body.trim()) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }
    const cleanAssertions = assertions.map((as) => {
      const out: Record<string, unknown> = { type: as.type };
      for (const f of ASSERTION_FIELDS[as.type] || []) {
        const val = (as as unknown as Record<string, unknown>)[f];
        if (val !== undefined && val !== '') out[f] = f === 'code' ? Number(val) : val;
      }
      return out as unknown as ApiAssertion;
    });
    return {
      type,
      name,
      enabled,
      tags: tagList,
      request: {
        method,
        url,
        headers: toObj(headers),
        params: toObj(params),
        ...(parsedBody !== undefined ? { body: parsedBody } : {}),
      },
      assertions: cleanAssertions,
    };
  }

  async function save() {
    setError('');
    try {
      const payload = buildPayload();
      if (editing && id) await updateTest(id, payload);
      else await createTest(payload);
      navigate('/tests');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Save failed');
    }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{editing ? 'Edit test' : 'New test'}</h2>
        <div className="row gap">
          <button className="btn ghost" onClick={() => navigate('/tests')}>
            Cancel
          </button>
          <button className="btn primary" onClick={save}>
            Save
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="grid2">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Descriptive test name" />
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as TestType)} disabled={editing}>
              <option value="ui">UI</option>
              <option value="api">API</option>
            </select>
          </label>
          <label>
            Tags (comma-separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="smoke, cart" />
          </label>
          <label className="check">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled (included in “run all enabled”)
          </label>
        </div>
        <p className="muted small">
          Tip: use <code>env:NAME</code> for secrets/URLs (e.g. <code>env:BASE_URL</code>,{' '}
          <code>env:SAUCEDEMO_USERNAME</code>) — resolved at run time, never stored as plain values.
        </p>
      </div>

      {type === 'ui' ? (
        <div className="card">
          <h3>Steps</h3>
          {steps.map((st, i) => (
            <div className="step-row" key={i}>
              <span className="step-no">{i + 1}</span>
              <select value={st.action} onChange={(e) => changeAction(i, e.target.value)}>
                {UI_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {(UI_ACTION_FIELDS[st.action] || []).map((f) => (
                <input
                  key={f}
                  className="grow"
                  placeholder={f}
                  value={(st[f] as string | number | undefined) ?? ''}
                  onChange={(e) => updateStep(i, { [f]: e.target.value } as Partial<UiStep>)}
                />
              ))}
              <div className="step-ctrls">
                <button className="icon" onClick={() => moveStep(i, -1)} title="Up">
                  ↑
                </button>
                <button className="icon" onClick={() => moveStep(i, 1)} title="Down">
                  ↓
                </button>
                <button className="icon danger" onClick={() => removeStep(i)} title="Remove">
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button className="btn" onClick={addStep}>
            + Add step
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>Request</h3>
            <div className="row gap">
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
              <input className="grow" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="env:API_URL/path" />
            </div>
            <KVEditor label="Headers" rows={headers} setRows={setHeaders} />
            <KVEditor label="Query params" rows={params} setRows={setParams} />
            <label>
              Body (JSON, optional)
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"status":"available"}' />
            </label>
          </div>
          <div className="card">
            <h3>Assertions</h3>
            {assertions.map((as, i) => (
              <div className="step-row" key={i}>
                <span className="step-no">{i + 1}</span>
                <select value={as.type} onChange={(e) => changeAssertion(i, e.target.value)}>
                  {ASSERTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {(ASSERTION_FIELDS[as.type] || []).map((f) => (
                  <input
                    key={f}
                    className="grow"
                    placeholder={f}
                    value={((as as unknown as Record<string, unknown>)[f] as string | number | undefined) ?? ''}
                    onChange={(e) => updateAssertion(i, { [f]: e.target.value } as Partial<ApiAssertion>)}
                  />
                ))}
                <div className="step-ctrls">
                  <button className="icon danger" onClick={() => removeAssertion(i)} title="Remove">
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button className="btn" onClick={addAssertion}>
              + Add assertion
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function KVEditor({ label, rows, setRows }: { label: string; rows: KV[]; setRows: (r: KV[]) => void }) {
  return (
    <div className="kv">
      <div className="muted small">{label}</div>
      {rows.map((r, i) => (
        <div className="row gap" key={i}>
          <input placeholder="key" value={r.k} onChange={(e) => setRows(rows.map((x, idx) => (idx === i ? { ...x, k: e.target.value } : x)))} />
          <input placeholder="value" value={r.v} onChange={(e) => setRows(rows.map((x, idx) => (idx === i ? { ...x, v: e.target.value } : x)))} />
          <button className="icon danger" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button className="btn ghost small" onClick={() => setRows([...rows, { k: '', v: '' }])}>
        + {label.toLowerCase()}
      </button>
    </div>
  );
}
