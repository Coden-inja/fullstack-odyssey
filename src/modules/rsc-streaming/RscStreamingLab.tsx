import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

type StreamPhase = 'idle' | 'shell_streamed' | 'data_resolved' | 'client_hydrated';

export const RscStreamingLab: React.FC = () => {
  const [phase, setPhase] = useState<StreamPhase>('idle');
  const [userClickedWhileStreaming, setUserClickedWhileStreaming] = useState<boolean>(false);
  const [buttonClicks, setButtonClicks] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenge tracking
  const [achievedShell, setAchievedShell] = useState<boolean>(false);
  const [achievedFlightStream, setAchievedFlightStream] = useState<boolean>(false);
  const [achievedHydration, setAchievedHydration] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'React 19 Server DOM & HTTP/2 chunked streaming engine ready.' },
    { id: '2', type: 'output', text: 'Dispatch HTTP GET /analytics to observe Transfer-Encoding: chunked and Flight wire frames.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('rsc-streaming')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const advanceStream = () => {
    const timestamp = Date.now();

    if (phase === 'idle') {
      setPhase('shell_streamed');
      setAchievedShell(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `--> HTTP GET /analytics HTTP/2 (Multiplexed)` },
        { id: (timestamp + 1).toString(), type: 'output', text: `Chunk 0 (14ms): Flushed <html><head> and <Suspense> fallback shell. TTFB: 14ms.` }
      ]);
      return;
    }

    if (phase === 'shell_streamed') {
      setPhase('data_resolved');
      setAchievedFlightStream(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `Server Promise resolved: SELECT * FROM monthly_metrics (180ms)` },
        { id: (timestamp + 1).toString(), type: 'success', text: `Chunk 1: Flushed React Flight payload + $RC("B:0", "S:0") replacement DOM node.` }
      ]);
      return;
    }

    if (phase === 'data_resolved') {
      setPhase('client_hydrated');
      setAchievedHydration(true);
      const replayed = userClickedWhileStreaming ? ' Replayed 1 queued user click event!' : '';
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'success', text: `Client: Hydrated 'use client' InteractiveButton island.${replayed}` }
      ]);
      if (userClickedWhileStreaming) {
        setButtonClicks(c => c + 1);
        setUserClickedWhileStreaming(false);
      }
      return;
    }

    // Reset
    setPhase('idle');
    setUserClickedWhileStreaming(false);
    setButtonClicks(0);
    setLogs([{ id: Date.now().toString(), type: 'system', text: 'RSC streaming pipeline reset to cold state.' }]);
  };

  const handleIslandClick = () => {
    if (phase !== 'client_hydrated') {
      setUserClickedWhileStreaming(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'output', text: `⚡ Event Queued: User clicked button before hydration! React event replaying queued dispatch.` }
      ]);
    } else {
      setButtonClicks(c => c + 1);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: `Client island active: Counter incremented to ${buttonClicks + 1}.` }
      ]);
    }
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('rsc-streaming')) {
        list.push('rsc-streaming');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 08 (React Server Components & Streaming) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  // Wire Protocol chunks based on stage
  const wireProtocolPreview = phase === 'idle'
    ? '// Cold connection: Waiting for HTTP GET /analytics'
    : phase === 'shell_streamed'
    ? `HTTP/2 200 OK\r\ncontent-type: text/html; charset=utf-8\r\ntransfer-encoding: chunked\r\n\r\n<!-- Chunk 0: Shell -->\r\n<div class="layout">\r\n  <h1>Analytics Header</h1>\r\n  <!--$?--><template id="B:0"></template>\r\n  <div class="skeleton-pulse">Loading Metrics...</div>\r\n  <!--/$-->\r\n</div>`
    : phase === 'data_resolved'
    ? `<!-- Chunk 1: Flight Payload & Swap -->\r\n<div hidden id="S:0">\r\n  <div class="metric-card">\r\n    <h2>$184,200.00</h2>\r\n    <span>Active ARR (+24%)</span>\r\n  </div>\r\n</div>\r\n<script>$RC("B:0","S:0")</script>\r\n<!-- React Flight serialized tree: -->\r\nM1:{"id":"./Button.js","chunks":["client-island.js"],"name":"InteractiveButton"}\r\nJ0:[["$","div",null,{"children":["$","$L1",null,{}]]]`
    : `<!-- Chunk 2: Hydration Complete -->\r\n// All React Flight references resolved.\r\n// Client bundle: 4.2 kB (Only InteractiveButton.js).\r\n// Server Components zero bundle overhead: 0 kB shipped.`;

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Zero-Bundle Flight Stream</span>
            <span className="badge badge-indigo">Module 08</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            React Server Components (RSC) divide an application into two distinct realms:
            <strong> Server Components</strong> (execute exclusively on Node.js/Edge; 0 kB shipped to client) and
            <strong> Client Components</strong> (interactive islands declared via <code style={{ color: 'var(--emerald)' }}>'use client'</code>).
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            <strong>Streaming SSR Invariant:</strong> The server flushes an initial HTML shell in under 20ms.
            Slow database promises stream as out-of-order chunks using the <strong>React Flight wire format</strong>.
          </p>
        </div>

        {/* Stepper Controller */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>HTTP/2 Chunked Stream Controller</span>
            <span className={`badge ${phase === 'client_hydrated' ? 'badge-emerald' : 'badge-indigo'}`}>
              Phase: {phase}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={advanceStream}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {phase === 'idle' && '▶ 1. Stream Initial HTML Shell (TTFB ~ 14ms)'}
              {phase === 'shell_streamed' && '▶ 2. Resolve Async Query & Stream Flight Chunk'}
              {phase === 'data_resolved' && '▶ 3. Hydrate Interactive Client Island'}
              {phase === 'client_hydrated' && '↺ Reset Pipeline to Cold'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
            <div style={{ padding: '8px 10px', background: '#040711', borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Client JS Bundle Size:</span>
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--emerald)', marginTop: 2 }}>
                4.2 kB <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>(0 kB for RSCs)</span>
              </strong>
            </div>
            <div style={{ padding: '8px 10px', background: '#040711', borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>First Contentful Paint:</span>
              <strong style={{ display: 'block', fontSize: 14, color: phase !== 'idle' ? 'var(--emerald)' : 'var(--text-dim)', marginTop: 2 }}>
                {phase !== 'idle' ? '14 ms' : 'Awaiting'}
              </strong>
            </div>
          </div>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>RSC Streaming Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedShell ? '✅' : '⏳'}</span>
              <span>Flush initial HTML shell without blocking on database queries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedFlightStream ? '✅' : '⏳'}</span>
              <span>Stream React Flight protocol payload replacing Suspense skeleton</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedHydration ? '✅' : '⏳'}</span>
              <span>Selectively hydrate 'use client' island without full-page bundle overhead</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedShell && achievedFlightStream && achievedHydration ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedShell || !achievedFlightStream || !achievedHydration}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 08 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="HTTP/2 Chunked Wire Buffer" />
      </div>

      {/* Right Column: Live Viewport & Flight Wire Protocol */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Browser Viewport (Simulated DOM)</span>
            <span className="badge badge-indigo">
              {phase === 'client_hydrated' ? 'Hydrated Interactive' : phase === 'data_resolved' ? 'SSR Rendered' : phase === 'shell_streamed' ? 'Skeleton Active' : 'Idle'}
            </span>
          </div>

          {/* Component Hierarchy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {/* Server Component Shell */}
            <div style={{
              padding: '14px 18px',
              borderRadius: 8,
              background: '#040711',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="badge badge-indigo">Server Component (RSC)</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Zero Client JS (0 kB)</span>
              </div>
              <h3 style={{ fontSize: 16, margin: '4px 0' }}>Enterprise Revenue Dashboard</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Rendered directly on Node.js/Edge with direct database access. No JSON API serialization needed.
              </p>
            </div>

            {/* Suspense Boundary / Client Island */}
            <div style={{
              padding: '20px',
              borderRadius: 8,
              background: '#040711',
              border: `1px solid ${phase === 'client_hydrated' ? 'var(--emerald)' : phase === 'data_resolved' ? 'var(--cyan)' : phase === 'shell_streamed' ? 'var(--amber)' : 'var(--border-subtle)'}`,
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {phase === 'idle' && (
                <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>[Awaiting stream start: Click Step 1]</p>
              )}

              {phase === 'shell_streamed' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 140, height: 28, background: 'rgba(245, 158, 11, 0.2)', borderRadius: 6, margin: '0 auto 10px', animation: 'pulse 1.2s infinite' }} />
                  <p style={{ color: 'var(--amber)', fontSize: 12 }}>
                    &lt;Suspense fallback&gt;: Loading live revenue stream from database...
                  </p>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 11, marginTop: 10 }}
                    onClick={handleIslandClick}
                  >
                    Click Me Before Hydration
                  </button>
                  {userClickedWhileStreaming && (
                    <span className="badge badge-rose" style={{ marginTop: 6, display: 'inline-block' }}>
                      Event captured in React queue!
                    </span>
                  )}
                </div>
              )}

              {(phase === 'data_resolved' || phase === 'client_hydrated') && (
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: 36, color: phase === 'client_hydrated' ? 'var(--emerald)' : 'var(--cyan)', margin: 0 }}>
                    $184,200.00
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    Live Annual Recurring Revenue (+24% MoM)
                  </p>

                  <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      className={`btn ${phase === 'client_hydrated' ? 'btn-success' : 'btn-secondary'}`}
                      onClick={handleIslandClick}
                      style={{ fontSize: 12 }}
                    >
                      {phase === 'client_hydrated' ? `✓ Island Active: ${buttonClicks} Clicks` : 'Island Hydrating...'}
                    </button>
                    <span className="badge badge-indigo">'use client' Island</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* React Flight Protocol Wire Frame */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Raw React Flight Protocol Wire Stream:</span>
              <span className="badge">Transfer-Encoding: chunked</span>
            </div>
            <pre style={{
              background: '#02040a',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--cyan)',
              lineHeight: 1.5,
              overflowX: 'auto',
              maxHeight: 180
            }}>
              {wireProtocolPreview}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};
