import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export interface MiddlewareLayer {
  id: string;
  name: string;
  arity: number; // 3 for (req, res, next), 4 for (err, req, res, next)
  category: 'Security' | 'Traffic' | 'Auth' | 'Handler' | 'Error';
  description: string;
  codeSnippet: string;
}

const DEFAULT_LAYERS: MiddlewareLayer[] = [
  {
    id: 'cors',
    name: 'cors({ origin: "*" })',
    arity: 3,
    category: 'Security',
    description: 'Injects Access-Control-Allow-Origin into response headers',
    codeSnippet: 'res.setHeader("Access-Control-Allow-Origin", "*");\nnext();'
  },
  {
    id: 'rate-limit',
    name: 'rateLimiter({ max: 60 })',
    arity: 3,
    category: 'Traffic',
    description: 'Queries Redis sliding window counter; halts if threshold exceeded',
    codeSnippet: 'if (req.tokens <= 0) return next(new Error("RATE_LIMIT_EXCEEDED"));\nres.setHeader("X-RateLimit-Remaining", "59");\nnext();'
  },
  {
    id: 'auth-guard',
    name: 'authGuard(req, res, next)',
    arity: 3,
    category: 'Auth',
    description: 'Verifies HMAC/RSA signature of Authorization header; attaches req.user',
    codeSnippet: 'if (!req.headers.authorization?.startsWith("Bearer ")) return next(new Error("UNAUTHORIZED"));\nreq.user = { id: 104, role: "developer" };\nnext();'
  },
  {
    id: 'order-controller',
    name: 'orderController(req, res)',
    arity: 3,
    category: 'Handler',
    description: 'Core endpoint: queries database and dispatches JSON payload',
    codeSnippet: 'if (!req.user) return res.status(403).json({ error: "Context Missing" });\nres.status(200).json({ status: "success", orders: [ { id: 4891, total: "$120.00" } ] });'
  },
  {
    id: 'error-handler',
    name: 'errorHandler(err, req, res, next)',
    arity: 4,
    category: 'Error',
    description: '4-arity error boundary: catches next(err) invocations',
    codeSnippet: 'const status = err.message === "UNAUTHORIZED" ? 401 : err.message === "RATE_LIMIT_EXCEEDED" ? 429 : 500;\nres.status(status).json({ error: err.message });'
  }
];

export const MiddlewareLab: React.FC = () => {
  const [layers, setLayers] = useState<MiddlewareLayer[]>(DEFAULT_LAYERS);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(-1);
  const [authHeader, setAuthHeader] = useState<string>('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sec');
  const [exhaustRateLimit, setExhaustRateLimit] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Live in-flight request/response context
  const [reqContext, setReqContext] = useState<{
    path: string;
    method: string;
    headers: Record<string, string>;
    user: { id: number; role: string } | null;
  }>({
    path: '/api/v1/orders',
    method: 'GET',
    headers: { authorization: authHeader, host: 'api.enterprise.internal' },
    user: null
  });

  const [resContext, setResContext] = useState<{
    statusCode: number | null;
    headers: Record<string, string>;
    body: string | null;
  }>({
    statusCode: null,
    headers: {},
    body: null
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Express 4.19 router stack initialized. Total registered layers: 5.' },
    { id: '2', type: 'output', text: 'Challenge: Inspect layer order, simulate request execution, and verify error boundaries.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('middleware')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    if (activeLayerIndex !== -1) return; // Cannot mutate while execution is active
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const nextLayers = [...layers];
    const temp = nextLayers[index];
    nextLayers[index] = nextLayers[targetIndex];
    nextLayers[targetIndex] = temp;
    setLayers(nextLayers);

    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'system', text: `router.stack mutated: Moved ${temp.name} ${direction}.` }
    ]);
  };

  const resetPipeline = () => {
    setActiveLayerIndex(-1);
    setReqContext({
      path: '/api/v1/orders',
      method: 'GET',
      headers: { authorization: authHeader, host: 'api.enterprise.internal' },
      user: null
    });
    setResContext({
      statusCode: null,
      headers: {},
      body: null
    });
    setLogs([
      { id: Date.now().toString(), type: 'system', text: 'Pipeline context reset to initial HTTP wire state.' }
    ]);
  };

  const dispatchInitial = () => {
    resetPipeline();
    setActiveLayerIndex(0);
    setLogs([
      { id: Date.now().toString(), type: 'system', text: `--> INCOMING TCP: GET /api/v1/orders HTTP/1.1` },
      { id: (Date.now() + 1).toString(), type: 'output', text: `router.handle(): Entering router.stack[0] (${layers[0].name})` }
    ]);
    executeLayer(0, {
      path: '/api/v1/orders',
      method: 'GET',
      headers: { authorization: authHeader, host: 'api.enterprise.internal' },
      user: null
    }, {
      statusCode: null,
      headers: {},
      body: null
    });
  };

  const executeLayer = (
    index: number,
    currReq: typeof reqContext,
    currRes: typeof resContext
  ) => {
    if (index >= layers.length) {
      setLogs(p => [...p, { id: Date.now().toString(), type: 'error', text: 'router.stack exhausted without res.send()! Socket hanging.' }]);
      return;
    }

    const layer = layers[index];
    setActiveLayerIndex(index);

    if (layer.id === 'cors') {
      const nextRes = {
        ...currRes,
        headers: { ...currRes.headers, 'Access-Control-Allow-Origin': '*' }
      };
      setResContext(nextRes);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'output', text: `[${index}] cors(): Set Access-Control-Allow-Origin: * -> next()` }
      ]);
      return;
    }

    if (layer.id === 'rate-limit') {
      if (exhaustRateLimit) {
        setLogs(p => [
          ...p,
          { id: Date.now().toString(), type: 'error', text: `[${index}] rateLimiter: Limit exceeded! next(new Error("RATE_LIMIT_EXCEEDED"))` }
        ]);
        jumpToErrorHandler('RATE_LIMIT_EXCEEDED', index, currReq, currRes);
        return;
      }
      const nextRes = {
        ...currRes,
        headers: { ...currRes.headers, 'X-RateLimit-Remaining': '59' }
      };
      setResContext(nextRes);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'output', text: `[${index}] rateLimiter: Redis token consumed. Remaining: 59 -> next()` }
      ]);
      return;
    }

    if (layer.id === 'auth-guard') {
      if (!authHeader || !authHeader.startsWith('Bearer eyJ')) {
        setLogs(p => [
          ...p,
          { id: Date.now().toString(), type: 'error', text: `[${index}] authGuard: Invalid JWT signature! next(new Error("UNAUTHORIZED"))` }
        ]);
        jumpToErrorHandler('UNAUTHORIZED', index, currReq, currRes);
        return;
      }
      const nextReq = {
        ...currReq,
        user: { id: 104, role: 'developer' }
      };
      setReqContext(nextReq);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: `[${index}] authGuard: JWT verified! Attached req.user = { id: 104, role: 'developer' } -> next()` }
      ]);
      return;
    }

    if (layer.id === 'order-controller') {
      if (!currReq.user) {
        setResContext({
          ...currRes,
          statusCode: 403,
          body: JSON.stringify({ error: 'Forbidden: No authenticated user context on req.user' }, null, 2)
        });
        setLogs(p => [
          ...p,
          { id: Date.now().toString(), type: 'error', text: `<-- HTTP 403 Forbidden: Handler reached before authGuard attached req.user!` }
        ]);
        return;
      }
      setResContext({
        ...currRes,
        statusCode: 200,
        body: JSON.stringify({ status: 'success', orders: [{ id: 4891, total: '$120.00', customer: 'User#104' }] }, null, 2)
      });
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: `<-- HTTP 200 OK: res.json() dispatched! Connection closed cleanly.` }
      ]);
      return;
    }

    if (layer.id === 'error-handler') {
      // Reached without error
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'output', text: `[${index}] errorHandler: Normal flow (arity 4 skipped when err is null) -> Done.` }
      ]);
    }
  };

  const jumpToErrorHandler = (
    errorCode: string,
    fromIdx: number,
    currReq: typeof reqContext,
    currRes: typeof resContext
  ) => {
    // Scan router.stack forward for arity === 4
    const errIdx = layers.findIndex((l, i) => i > fromIdx && l.arity === 4);
    if (errIdx === -1) {
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'error', text: `FATAL: Uncaught exception ${errorCode}! No 4-argument error handler in router.stack!` }
      ]);
      setResContext({
        ...currRes,
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error', trace: errorCode }, null, 2)
      });
      return;
    }

    setActiveLayerIndex(errIdx);
    const status = errorCode === 'UNAUTHORIZED' ? 401 : errorCode === 'RATE_LIMIT_EXCEEDED' ? 429 : 500;
    setResContext({
      ...currRes,
      statusCode: status,
      body: JSON.stringify({ error: errorCode, code: status }, null, 2)
    });
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'output', text: `⚡ Error Leap: Skipped layers ${fromIdx + 1}..${errIdx - 1} directly to [${errIdx}] ${layers[errIdx].name}` },
      { id: (Date.now() + 1).toString(), type: 'error', text: `<-- HTTP ${status} Response emitted by error boundary.` }
    ]);
  };

  const stepNext = () => {
    if (activeLayerIndex === -1) {
      dispatchInitial();
      return;
    }
    const nextIdx = activeLayerIndex + 1;
    if (nextIdx < layers.length) {
      executeLayer(nextIdx, reqContext, resContext);
    } else {
      setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: 'router.stack finished traversal.' }]);
    }
  };

  // Validate pipeline order
  const corsIdx = layers.findIndex(l => l.id === 'cors');
  const authIdx = layers.findIndex(l => l.id === 'auth-guard');
  const orderIdx = layers.findIndex(l => l.id === 'order-controller');
  const errIdx = layers.findIndex(l => l.id === 'error-handler');

  const isPipelineValid = authIdx < orderIdx && errIdx > orderIdx;

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('middleware')) {
        list.push('middleware');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 02 (Express Middleware Onion) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Leaky Pipeline & The Hanging Socket</span>
            <span className="badge badge-indigo">Module 02</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            In Express, middleware executes sequentially in the exact order declared in the internal{' '}
            <code style={{ color: 'var(--indigo)' }}>router.stack</code> array. Each layer receives mutable{' '}
            <code style={{ color: 'var(--cyan)' }}>(req, res, next)</code> references.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            <strong>Rule:</strong> If an authentication guard is declared <em>after</em> the route controller, unauthenticated callers reach the database.
            If a middleware fails to invoke <code style={{ color: 'var(--amber)' }}>next()</code>, the socket hangs indefinitely.
          </p>
        </div>

        {/* HTTP Request Configurator */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Incoming Wire Request</span>
            <span className="badge">HTTP/1.1</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Authorization Header:</label>
              <input
                type="text"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#040711',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  marginTop: 4
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={exhaustRateLimit}
                onChange={(e) => setExhaustRateLimit(e.target.checked)}
              />
              <span>Simulate Redis Token Bucket Exhaustion (Trigger 429)</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={stepNext}>
              {activeLayerIndex < 0 ? '▶ Dispatch Request' : 'Step next() →'}
            </button>
            <button className="btn btn-secondary" onClick={resetPipeline}>
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Validation & Completion Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Architecture Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : isPipelineValid ? 'badge-indigo' : ''}`}>
              {isCompleted ? '✓ Completed' : isPipelineValid ? 'Order Correct' : 'Vulnerable'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{authIdx < orderIdx ? '✅' : '❌'}</span>
              <span>authGuard before orderController (Prevents unauthorized leak)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{errIdx > orderIdx ? '✅' : '❌'}</span>
              <span>4-arity errorHandler registered at tail (Catches all exceptions)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{resContext.statusCode === 200 ? '✅' : '⏳'}</span>
              <span>Successful 200 OK delivery with authenticated req.user</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : isPipelineValid && resContext.statusCode === 200 ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!isPipelineValid || resContext.statusCode !== 200}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 02 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="Express Runtime Traces" />
      </div>

      {/* Right Column: Layer Stack Reorder & Context Inspector */}
      <div className="lab-panel-right">
        {/* Router Stack Manager */}
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Internal Express router.stack Array</span>
            <span className="badge badge-emerald">
              Active Layer: {activeLayerIndex >= 0 ? `[${activeLayerIndex}] ${layers[activeLayerIndex].name}` : 'Awaiting Request'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {layers.map((layer, idx) => {
              const isActive = activeLayerIndex === idx;
              const isPast = activeLayerIndex > idx;
              return (
                <div
                  key={layer.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: isActive ? 'rgba(99, 102, 241, 0.22)' : isPast ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isActive ? 'var(--indigo)' : isPast ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', width: 24 }}>
                      [{idx}]
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: isActive ? '#fff' : isPast ? 'var(--emerald)' : 'var(--text-muted)' }}>
                          {layer.name}
                        </strong>
                        <span className={`badge ${layer.arity === 4 ? 'badge-rose' : 'badge-indigo'}`}>
                          arity: {layer.arity}
                        </span>
                        <span className="badge">{layer.category}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{layer.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      disabled={idx === 0 || activeLayerIndex !== -1}
                      onClick={() => moveLayer(idx, 'up')}
                      title="Move up in router.stack"
                    >
                      ▲
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      disabled={idx === layers.length - 1 || activeLayerIndex !== -1}
                      onClick={() => moveLayer(idx, 'down')}
                      title="Move down in router.stack"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Context Inspector (req / res in-flight state) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {/* Mutable req object */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 13, color: 'var(--indigo)' }}>Incoming req Context</strong>
                <span className="badge">Mutable Object</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>path:</strong> {reqContext.path}</div>
                <div><strong>method:</strong> {reqContext.method}</div>
                <div>
                  <strong>req.user:</strong>{' '}
                  <span style={{ color: reqContext.user ? 'var(--emerald)' : 'var(--rose)' }}>
                    {reqContext.user ? JSON.stringify(reqContext.user) : 'undefined (Unauthenticated)'}
                  </span>
                </div>
                <div>
                  <strong>headers:</strong>
                  <pre style={{ margin: '4px 0 0', padding: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'auto', maxHeight: 80 }}>
                    {JSON.stringify(reqContext.headers, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Mutable res object */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 13, color: 'var(--emerald)' }}>Outgoing res Context</strong>
                <span className="badge">
                  {resContext.statusCode ? `HTTP ${resContext.statusCode}` : 'Pending Header Flush'}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: resContext.statusCode === 200 ? 'var(--emerald)' : resContext.statusCode ? 'var(--rose)' : 'var(--text-dim)' }}>
                    {resContext.statusCode || 'Not sent yet'}
                  </span>
                </div>
                <div>
                  <strong>Headers:</strong>
                  <pre style={{ margin: '4px 0 0', padding: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'auto', maxHeight: 80 }}>
                    {Object.keys(resContext.headers).length === 0 ? '[No headers injected]' : JSON.stringify(resContext.headers, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Payload:</strong>
                  <pre style={{ margin: '4px 0 0', padding: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'auto', maxHeight: 80, color: '#fff' }}>
                    {resContext.body || '[Socket open: Awaiting res.send()]'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
