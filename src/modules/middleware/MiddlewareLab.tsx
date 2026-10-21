import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface MiddlewareLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  pipelineLayers: { name: string; type: 'normal' | 'auth' | 'route' | 'error'; desc: string }[];
  initialAuth: boolean;
  initialError: boolean;
  expectedFinalStatus: number;
}

const MIDDLEWARE_LEVELS: MiddlewareLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Request Journey',
    subtitle: 'Passing Requests with next()',
    story: 'When an HTTP request arrives at your Express server, it does not jump straight to the database. It travels down an assembly line of functions called middleware.',
    concept: 'Every middleware receives three things: (req, res, next). It does some work, and then it MUST call next() to hand the request to the next function. If next() is not called, the browser waits forever.',
    goalDescription: 'Click "Send Request" and step through each middleware layer to see how next() passes control until a response is sent.',
    hint: 'Click "Send Request" and then click "Step next() →" until the response reaches status 200.',
    pipelineLayers: [
      { name: 'logger', type: 'normal', desc: 'Logs HTTP method and URL (GET /api/profile)' },
      { name: 'corsHeader', type: 'normal', desc: 'Attaches Access-Control-Allow-Origin: *' },
      { name: 'profileRouteHandler', type: 'route', desc: 'Sends JSON response { user: "guest" }' }
    ],
    initialAuth: true,
    initialError: false,
    expectedFinalStatus: 200
  },
  {
    id: 2,
    title: 'Level 2: Mutating the Request Context',
    subtitle: 'Attaching req.user and Custom Headers',
    story: 'How does your route handler know who is logged in? An authentication middleware verifies the login token and attaches req.user = { id: 42, role: "member" } so all future middleware can read it.',
    concept: 'req is a single shared JavaScript object. Any middleware can attach new properties to req (like req.user or req.requestId). All subsequent middleware can inspect and use those properties.',
    goalDescription: 'Watch the tokenVerifier middleware attach req.user and inspect the final modified request object.',
    hint: 'Send the request and step through to see req.user get populated.',
    pipelineLayers: [
      { name: 'requestIdInjector', type: 'normal', desc: 'Generates req.id = "req_88a" and adds header' },
      { name: 'tokenVerifier', type: 'auth', desc: 'Decodes token and attaches req.user = { id: 42, name: "Alex" }' },
      { name: 'userDashboardHandler', type: 'route', desc: 'Reads req.user and returns personalized JSON' }
    ],
    initialAuth: true,
    initialError: false,
    expectedFinalStatus: 200
  },
  {
    id: 3,
    title: 'Level 3: The Security Gate',
    subtitle: 'Blocking Unauthorized Requests Early',
    story: 'What if someone tries to access private data without a token? You do not want to run your expensive database code! You stop them at the door.',
    concept: 'If a middleware returns res.status(401).json({ error: "Unauthorized" }) WITHOUT calling next(), the pipeline immediately stops. Express sends the response back to the browser and never calls subsequent handlers.',
    goalDescription: 'Turn "Include Auth Token" OFF, send a request, and watch the auth guard stop the request with HTTP 401 before it ever touches the route.',
    hint: 'Toggle "Include Auth Token" to OFF and click "Send Request".',
    pipelineLayers: [
      { name: 'logger', type: 'normal', desc: 'Logs incoming request' },
      { name: 'authGuard', type: 'auth', desc: 'Checks Authorization header. If missing, sends 401 and HALTS' },
      { name: 'billingDashboardHandler', type: 'route', desc: 'Expensive database query (should be skipped!)' }
    ],
    initialAuth: false,
    initialError: false,
    expectedFinalStatus: 401
  },
  {
    id: 4,
    title: 'Level 4: Error Handling Boundaries',
    subtitle: 'The Special 4-Argument Function: (err, req, res, next)',
    story: 'What happens if your database crashes or throws an unexpected exception midway through a request? How does Express prevent the entire Node process from dying?',
    concept: 'If any middleware calls next(new Error("DB Down")), Express immediately skips all normal middleware and jumps straight to the 4-argument error handler (err, req, res, next). The 4 arguments tell Express this is an error boundary.',
    goalDescription: 'Simulate an unexpected database error and observe Express bypass normal routes to jump straight to the error handler.',
    hint: 'Enable "Simulate Database Crash", send a request, and watch the error handler catch it.',
    pipelineLayers: [
      { name: 'logger', type: 'normal', desc: 'Logs request' },
      { name: 'dbFetcher', type: 'route', desc: 'Simulates database read. Throws error and calls next(err)' },
      { name: 'normalResponseHandler', type: 'normal', desc: 'Normal route (will be bypassed!)' },
      { name: 'errorHandler', type: 'error', desc: 'Catches error (err, req, res, next) and returns clean 500 JSON' }
    ],
    initialAuth: true,
    initialError: true,
    expectedFinalStatus: 500
  }
];

export const MiddlewareLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = MIDDLEWARE_LEVELS[levelIdx];

  const [activeStep, setActiveStep] = useState<number>(-1);
  const [hasToken, setHasToken] = useState<boolean>(currentLevel.initialAuth);
  const [hasError, setHasError] = useState<boolean>(currentLevel.initialError);

  const [reqContext, setReqContext] = useState<Record<string, any>>({
    url: '/api/resource',
    method: 'GET'
  });
  const [resHeaders, setResHeaders] = useState<Record<string, string>>({});
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [resBody, setResBody] = useState<string | null>(null);

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon && resStatus === currentLevel.expectedFinalStatus) {
      setLevelWon(true);
      saveModuleCompletion();
    }
  }, [resStatus, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('middleware')) {
        list.push('middleware');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    const l = MIDDLEWARE_LEVELS[idx];
    setActiveStep(-1);
    setHasToken(l.initialAuth);
    setHasError(l.initialError);
    setReqContext({ url: '/api/resource', method: 'GET' });
    setResHeaders({});
    setResStatus(null);
    setResBody(null);
    setShowHint(false);
    setLevelWon(false);
  };

  const sendRequest = () => {
    setActiveStep(0);
    setReqContext({
      url: '/api/resource',
      method: 'GET',
      headers: hasToken ? { authorization: 'Bearer tok_demo_984' } : {}
    });
    setResHeaders({});
    setResStatus(null);
    setResBody(null);
  };

  const stepNext = () => {
    if (activeStep < 0) {
      sendRequest();
      return;
    }

    const currentLayer = currentLevel.pipelineLayers[activeStep];

    // Auth gate check in Level 3
    if (currentLevel.id === 3 && currentLayer.type === 'auth' && !hasToken) {
      setResStatus(401);
      setResBody(JSON.stringify({ error: 'Unauthorized: Missing Bearer Token' }, null, 2));
      return;
    }

    // Error boundary trigger in Level 4
    if (currentLevel.id === 4 && currentLayer.name === 'dbFetcher' && hasError) {
      // Jump straight to errorHandler (last layer)
      setActiveStep(currentLevel.pipelineLayers.length - 1);
      setResStatus(500);
      setResBody(JSON.stringify({ error: 'Internal Server Error: Database Connection Timeout' }, null, 2));
      return;
    }

    // Normal layer execution
    if (currentLayer.name === 'requestIdInjector') {
      setReqContext(prev => ({ ...prev, requestId: 'req_88a' }));
      setResHeaders(prev => ({ ...prev, 'x-request-id': 'req_88a' }));
    } else if (currentLayer.name === 'tokenVerifier') {
      setReqContext(prev => ({ ...prev, user: { id: 42, name: 'Alex', role: 'member' } }));
    } else if (currentLayer.name === 'corsHeader') {
      setResHeaders(prev => ({ ...prev, 'access-control-allow-origin': '*' }));
    }

    // If next layer is available
    if (activeStep < currentLevel.pipelineLayers.length - 1) {
      const nextIdx = activeStep + 1;
      setActiveStep(nextIdx);

      // If next is a route handler that sends response
      const nextLayer = currentLevel.pipelineLayers[nextIdx];
      if (nextLayer.type === 'route') {
        setResStatus(200);
        setResBody(JSON.stringify({ success: true, message: 'Response generated by route handler' }, null, 2));
      }
    }
  };

  const autoPlaySolution = () => {
    resetLevel(levelIdx);
    setTimeout(() => {
      sendRequest();
      setTimeout(() => stepNext(), 500);
      setTimeout(() => stepNext(), 1000);
      setTimeout(() => stepNext(), 1500);
    }, 200);
  };

  return (
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Middleware Onion Pipeline Visualizer + Companion Actions Panel */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live Pipeline Visualizer & Context Inspector */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  Express.js Middleware Onion Pipeline
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Inbound request enters concentric layers, mutates req context, and delegates via next().
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge badge-indigo">GET /api/resource</span>
                {resStatus && (
                  <span className={`badge ${resStatus === 200 ? 'badge-success' : resStatus === 401 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 11 }}>
                    HTTP {resStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Visual Pipeline Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {currentLevel.pipelineLayers.map((layer, idx) => {
                const isActive = activeStep === idx;
                const isPassed = activeStep > idx;

                return (
                  <div
                    key={layer.name}
                    style={{
                      background: isActive ? 'var(--primary-light)' : isPassed ? 'var(--bg-subtle)' : '#ffffff',
                      border: `1.5px solid ${isActive ? 'var(--primary)' : isPassed ? 'var(--border-light)' : 'var(--border-strong)'}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          background: isActive ? 'var(--primary)' : isPassed ? 'var(--success)' : 'var(--bg-hover)',
                          color: isActive || isPassed ? '#ffffff' : 'var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? 'var(--primary)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                          app.use({layer.name})
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {layer.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge" style={{ fontSize: 10 }}>{layer.type}</span>
                      {isActive && <span className="badge badge-indigo" style={{ fontSize: 10 }}>Executing next()</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Context & Response Inspector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#38bdf8', marginBottom: 4, fontWeight: 700, fontSize: 11 }}>Request Context (req):</div>
                <pre style={{ margin: 0, overflow: 'auto', color: '#e2e8f0', maxHeight: 85 }}>
                  {JSON.stringify(reqContext, null, 2)}
                </pre>
              </div>

              <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#34d399', marginBottom: 4, fontWeight: 700, fontSize: 11 }}>
                  Response State (res): <span style={{ color: resStatus === 200 ? '#34d399' : '#f87171' }}>{resStatus ? `${resStatus}` : 'Pending'}</span>
                </div>
                <pre style={{ margin: 0, overflow: 'auto', color: '#e2e8f0', maxHeight: 85 }}>
                  {resBody || '// Awaiting response transmission'}
                </pre>
              </div>
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact Pipeline Terminal & Controls */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {MIDDLEWARE_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  className={`btn btn-sm ${levelIdx === idx ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLevelIdx(idx)}
                  style={{ borderRadius: 9999, padding: '3px 9px', fontSize: 11 }}
                >
                  Level {lvl.id}
                </button>
              ))}
            </div>

            {/* Bullets & Goal Box */}
            <div className="level-bullets-box">
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {currentLevel.subtitle}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>
                {currentLevel.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {currentLevel.goalDescription}
              </div>

              {/* Interactive Toggles */}
              {currentLevel.id === 3 && (
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={hasToken}
                    onChange={(e) => setHasToken(e.target.checked)}
                  />
                  Include Authorization: Bearer Token
                </label>
              )}

              {currentLevel.id === 4 && (
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={hasError}
                    onChange={(e) => setHasError(e.target.checked)}
                  />
                  Simulate Database Query Crash in Route
                </label>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {activeStep < 0 ? (
                  <button className="btn btn-primary btn-sm" onClick={sendRequest} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Send Request →
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={stepNext} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Step next() →
                  </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => setShowHint(!showHint)} style={{ fontSize: 11, padding: '4px 8px' }}>
                  {showHint ? 'Hide Hint' : 'Hint'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={autoPlaySolution} style={{ fontSize: 11, padding: '4px 8px' }}>
                  Auto-Play
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => resetLevel(levelIdx)} style={{ fontSize: 11, padding: '4px 8px' }}>
                  Reset
                </button>
              </div>

              {showHint && (
                <div style={{ marginTop: 4, padding: '6px 8px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 11.5, color: '#92400e' }}>
                  <strong>Hint: </strong>{currentLevel.hint}
                </div>
              )}
            </div>

            {/* Compact Authentic macOS Pipeline Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  EXPRESS HTTP REQUEST DISPATCHER
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {activeStep === -1 ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    Waiting for incoming request... Click "Send Request" above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="terminal-line" style={{ color: '#38bdf8' }}>
                      <span className="glyph">→</span>
                      <span>INBOUND: GET /api/resource</span>
                    </div>
                    {activeStep >= 0 && (
                      <div className="terminal-line" style={{ color: '#cbd5e1' }}>
                        <span className="glyph">•</span>
                        <span>[pipeline] Layer 0 (cors): Injected Access-Control headers</span>
                      </div>
                    )}
                    {activeStep >= 1 && (
                      <div className="terminal-line" style={{ color: '#cbd5e1' }}>
                        <span className="glyph">•</span>
                        <span>[pipeline] Layer 1 (logger): Timestamped request entry</span>
                      </div>
                    )}
                    {activeStep >= 2 && (
                      <div className="terminal-line" style={{ color: hasToken || currentLevel.id !== 3 ? '#4ade80' : '#f87171' }}>
                        <span className="glyph">{hasToken || currentLevel.id !== 3 ? '✓' : '✗'}</span>
                        <span>[pipeline] Layer 2 (auth): {hasToken || currentLevel.id !== 3 ? 'Bearer token validated' : 'Missing token -> 401 Unauthorized'}</span>
                      </div>
                    )}
                    {resStatus && (
                      <div className="terminal-line" style={{ color: resStatus === 200 ? '#4ade80' : '#f87171' }}>
                        <span className="glyph">✓</span>
                        <span>OUTBOUND: HTTP {resStatus} Transmitted to Client</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Level Completion Status */}
            {levelWon && (
              <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 12 }}>Level Completed!</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered middleware execution.</div>
                </div>
                {levelIdx < MIDDLEWARE_LEVELS.length - 1 ? (
                  <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Next Level →
                  </button>
                ) : (
                  <span className="badge badge-success">Mastered!</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Scroll for Deep Architectural Mechanics & Incident Story */}
      <div className="lab-lesson-bottom">
        {/* Left Card: Middleware Composition Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            Software Architecture Pattern
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            Continuation-Passing Onion Mechanics
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Express Dispatch Loop:</div>
            <div>function next(err) &#123;</div>
            <div>&nbsp;&nbsp;const layer = stack[idx++];</div>
            <div>&nbsp;&nbsp;if (err) &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;if (layer.length === 4) layer.handle(err, req, res, next);</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;else next(err); // Skip regular middleware</div>
            <div>&nbsp;&nbsp;&#125; else &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;layer.handle(req, res, next);</div>
            <div>&nbsp;&nbsp;&#125;</div>
            <div>&#125;</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The Forgotten next() Socket Leak
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> If a middleware function neither calls `next()` nor terminates the HTTP exchange with `res.send()` / `res.end()`, the client TCP socket remains open indefinitely until hitting the load balancer's 60-second gateway timeout.
          </div>
        </div>
      </div>
    </div>
  );
};
