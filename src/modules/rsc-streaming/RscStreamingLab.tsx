import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const RscStreamingLab: React.FC = () => {
  const [stage, setStage] = useState<'idle' | 'shell' | 'data' | 'hydrated'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Next.js 15 Server Component engine ready.' }
  ]);

  const advanceStream = () => {
    if (stage === 'idle') {
      setStage('shell');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: 'HTTP GET /dashboard (Streaming SSR initiated)' },
        { id: (Date.now() + 1).toString(), type: 'output', text: 'Chunk 0: Sent static HTML shell + Suspense Skeleton in 12ms.' }
      ]);
    } else if (stage === 'shell') {
      setStage('data');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: 'Database query resolved on server: SELECT * FROM revenue;' },
        { id: (Date.now() + 1).toString(), type: 'success', text: 'Chunk 1: Streamed React Flight protocol payload replacing fallback skeleton.' }
      ]);
    } else if (stage === 'data') {
      setStage('hydrated');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: 'Client: Hydration islands interactive. Event listeners bound with 0ms lag.' }
      ]);
    } else {
      setStage('idle');
      setLogs([{ id: Date.now().toString(), type: 'system', text: 'Reset RSC streaming demo.' }]);
    }
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">Streaming Pipeline Controller</div>
          <button className="btn btn-primary" onClick={advanceStream} style={{ width: '100%', justifyContent: 'center' }}>
            {stage === 'idle' && '▶ 1. Stream Initial HTML Shell'}
            {stage === 'shell' && '▶ 2. Resolve Async Data & Stream Flight Chunk'}
            {stage === 'data' && '▶ 3. Hydrate Interactive Client Island'}
            {stage === 'hydrated' && '↺ Reset Pipeline'}
          </button>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">React Flight Wire Protocol</div>
          <div className="code-preview-box" style={{ fontSize: 11 }}>
            {stage === 'idle' && '// Awaiting request...'}
            {stage === 'shell' && '0:D{"name":"Dashboard","loading":true}'}
            {(stage === 'data' || stage === 'hydrated') && '1:I["./RevenueCard.js",["default"]]\n2:{"revenue":"$48,290","growth":"+18.4%"}'}
          </div>
        </div>

        <TerminalPane logs={logs} title="HTTP Chunked Transfer Log" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Client Browser Viewport</span>
            <span className={`badge ${stage === 'hydrated' ? 'badge-emerald' : 'badge-indigo'}`}>
              Stage: {stage}
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 16, background: '#070b14', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="badge badge-indigo">Server Component</span>
              <h3 style={{ marginTop: 6, fontSize: 18 }}>Organization Dashboard</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pre-rendered statically on server without JavaScript shipping to browser.</p>
            </div>

            <div style={{ padding: 20, background: '#070b14', borderRadius: 8, border: `1px solid ${stage === 'hydrated' ? 'var(--emerald)' : 'var(--border-subtle)'}`, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stage === 'idle' && <p style={{ color: 'var(--text-dim)' }}>[Awaiting stream start]</p>}
              {stage === 'shell' && <p style={{ color: 'var(--amber)' }}>[Suspense Skeleton Loading Animated Pulse...]</p>}
              {stage === 'data' && (
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: 32, color: 'var(--cyan)' }}>$48,290.00</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Monthly Recurring Revenue (+18.4%)</p>
                  <span className="badge badge-amber" style={{ marginTop: 8 }}>HTML Delivered (Hydrating...)</span>
                </div>
              )}
              {stage === 'hydrated' && (
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: 32, color: 'var(--emerald)' }}>$48,290.00</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Monthly Recurring Revenue (+18.4%)</p>
                  <span className="badge badge-emerald" style={{ marginTop: 8 }}>✓ Interactive Island Hydrated</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
