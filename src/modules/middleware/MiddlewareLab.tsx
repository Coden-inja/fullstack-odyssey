import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const MiddlewareLab: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [authHeader, setAuthHeader] = useState<string>('Bearer valid_jwt_token_99');
  const [rateLimitTrigger, setRateLimitTrigger] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Express server listening on port 3000.' },
    { id: '2', type: 'output', text: 'Ready to dispatch simulated HTTP GET /api/v1/orders' }
  ]);

  const pipeline = [
    { id: 0, name: 'cors()', desc: 'Sets Access-Control-Allow-Origin: *', layer: 'Security' },
    { id: 1, name: 'helmet()', desc: 'Sets Content-Security-Policy & X-Frame-Options', layer: 'Security' },
    { id: 2, name: 'rateLimiter()', desc: 'Tracks IP tokens in Redis (100 req/min limit)', layer: 'Traffic' },
    { id: 3, name: 'authGuard()', desc: 'Validates Bearer token & attaches req.user', layer: 'Auth' },
    { id: 4, name: 'orderController(req, res)', desc: 'Processes business logic & formats JSON response', layer: 'Handler' },
    { id: 5, name: 'errorHandler(err, req, res, next)', desc: 'Global exception boundary catching unhandled rejections', layer: 'Error' }
  ];

  const dispatchRequest = () => {
    setActiveStep(0);
    setLogs([
      { id: Date.now().toString(), type: 'system', text: '--> HTTP GET /api/v1/orders' },
      { id: (Date.now() + 1).toString(), type: 'output', text: '[0] cors(): Injected CORS headers. Calling next().' }
    ]);
  };

  const stepNext = () => {
    if (activeStep < 0) {
      dispatchRequest();
      return;
    }

    const nextIdx = activeStep + 1;
    if (nextIdx === 2 && rateLimitTrigger) {
      setActiveStep(5);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'error', text: '[2] rateLimiter: 429 Too Many Requests! next(new RateLimitError())' },
        { id: (Date.now() + 1).toString(), type: 'output', text: 'Skipping handlers -> Caught by errorHandler()' },
        { id: (Date.now() + 2).toString(), type: 'error', text: '<-- HTTP 429 Too Many Requests (Retry-After: 60s)' }
      ]);
      return;
    }

    if (nextIdx === 3 && (!authHeader || !authHeader.includes('valid'))) {
      setActiveStep(5);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'error', text: '[3] authGuard: Missing or invalid token! next(new UnauthorizedError())' },
        { id: (Date.now() + 1).toString(), type: 'output', text: 'Skipping routeHandler -> Caught by errorHandler()' },
        { id: (Date.now() + 2).toString(), type: 'error', text: '<-- HTTP 401 Unauthorized (Invalid Signature)' }
      ]);
      return;
    }

    if (nextIdx < 5) {
      setActiveStep(nextIdx);
      const step = pipeline[nextIdx];
      setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: `[${nextIdx}] ${step.name}: Processed successfully. Context forwarded via next().` }]);
    } else if (nextIdx === 5) {
      setActiveStep(4);
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: '<-- HTTP 200 OK: Content-Type: application/json (142 orders returned)' }]);
    }
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">HTTP Request Configurator</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Authorization Header:</label>
              <input 
                type="text" 
                value={authHeader} 
                onChange={(e) => setAuthHeader(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#05070f', border: '1px solid var(--border-subtle)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rateLimitTrigger} 
                  onChange={(e) => setRateLimitTrigger(e.target.checked)} 
                />
                <span>Simulate Rate Limit Exhaustion (HTTP 429)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Controls</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={stepNext}>
              {activeStep < 0 ? '▶ Dispatch Request' : 'Step next() →'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setActiveStep(-1); setLogs([{ id: '1', type: 'system', text: 'Pipeline reset.' }]); }}>
              Reset
            </button>
          </div>
        </div>

        <TerminalPane logs={logs} title="HTTP Pipeline Trace" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Express Middleware Onion Pipeline</span>
            <span className="badge badge-emerald">Sequential Array Resolution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pipeline.map((p) => {
              const isActive = activeStep === p.id;
              const isPast = activeStep > p.id;
              return (
                <div 
                  key={p.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(99, 102, 241, 0.25)' : isPast ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isActive ? 'var(--indigo)' : isPast ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)' }}>0{p.id + 1}</span>
                    <div>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: isActive ? '#fff' : isPast ? 'var(--emerald)' : 'var(--text-muted)' }}>
                        {p.name}
                      </strong>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</p>
                    </div>
                  </div>

                  <span className={`badge ${isActive ? 'badge-indigo' : isPast ? 'badge-emerald' : ''}`}>
                    {isActive ? 'Executing...' : isPast ? '✓ Passed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
