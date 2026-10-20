import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

interface MiddlewareStep {
  name: string;
  role: string;
  status: 'pending' | 'running' | 'passed' | 'error';
}

export const MiddlewareOnionSimulator: React.FC = () => {
  const [steps, setSteps] = useState<MiddlewareStep[]>([
    { name: 'cors()', role: 'Injects Access-Control-Allow-Origin headers', status: 'pending' },
    { name: 'bodyParser.json()', role: 'Buffers network stream into req.body AST', status: 'pending' },
    { name: 'authGuard()', role: 'Validates Bearer token & attaches req.user', status: 'pending' },
    { name: 'rateLimiter()', role: 'Inspects IP token bucket in Redis', status: 'pending' },
    { name: 'routeHandler(req, res)', role: 'Executes controller and dispatches JSON response', status: 'pending' },
    { name: 'errorHandler(err, req, res, next)', role: 'Catches uncaught promise rejections', status: 'pending' }
  ]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [triggerFail, setTriggerFail] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Incoming HTTP GET /api/v1/orders' }
  ]);

  const stepForward = () => {
    if (currentIdx >= steps.length) {
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: 'Response payload sent: HTTP 200 OK (Cycle complete)' }]);
      return;
    }

    const nextSteps = [...steps];
    const step = nextSteps[currentIdx];

    if (triggerFail && step.name === 'authGuard()') {
      step.status = 'error';
      nextSteps[nextSteps.length - 1].status = 'running';
      setCurrentIdx(nextSteps.length);
      setSteps(nextSteps);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'error', text: 'authGuard: Invalid Signature! next(new UnauthorizedError())' },
        { id: (Date.now() + 1).toString(), type: 'output', text: 'Bypassing pipeline straight to errorHandler(err, req, res, next)' }
      ]);
      return;
    }

    step.status = 'passed';
    if (currentIdx + 1 < steps.length) {
      nextSteps[currentIdx + 1].status = 'running';
    }
    setSteps(nextSteps);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: `[next()] ${step.name} finished. Context forwarded.` }]);
    setCurrentIdx(currentIdx + 1);
  };

  const resetPipeline = () => {
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));
    setCurrentIdx(0);
    setTriggerFail(false);
    setLogs([{ id: Date.now().toString(), type: 'system', text: 'Pipeline reset. Ready for incoming HTTP request.' }]);
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 2</span>
          <span className="badge">Express / Fastify Pipeline</span>
        </div>
        <h2 className="sim-title">Express Middleware Onion Architecture</h2>
        <p className="sim-desc">
          Express requests pass sequentially through an array of handler functions. Each middleware can modify 
          <code>req</code> and <code>res</code>, call <code>next()</code> to hand over execution, or pass an error to leap to the error boundary.
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={stepForward}>▶ Execute next()</button>
        <button className={`btn ${triggerFail ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setTriggerFail(!triggerFail)}>
          {triggerFail ? '⚠️ Auth Failure Injected' : 'Simulate Auth Error'}
        </button>
        <button className="btn btn-secondary" onClick={resetPipeline}>Reset Pipeline</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {steps.map((s, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: 10,
            background: s.status === 'passed' ? 'rgba(16, 185, 129, 0.1)' : s.status === 'error' ? 'rgba(244, 63, 94, 0.15)' : s.status === 'running' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
            border: `1px solid ${s.status === 'passed' ? 'rgba(16, 185, 129, 0.4)' : s.status === 'error' ? 'rgba(244, 63, 94, 0.5)' : s.status === 'running' ? 'var(--accent-indigo)' : 'var(--border-color)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>0{idx + 1}</span>
              <div>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: s.status === 'passed' ? 'var(--accent-emerald)' : s.status === 'error' ? 'var(--accent-rose)' : '#fff' }}>{s.name}</strong>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.role}</p>
              </div>
            </div>
            <span className={`badge ${s.status === 'passed' ? 'active' : ''}`} style={{ textTransform: 'uppercase' }}>{s.status}</span>
          </div>
        ))}
      </div>

      <TerminalPane logs={logs} title="Middleware Request Context Stream" />
    </div>
  );
};
