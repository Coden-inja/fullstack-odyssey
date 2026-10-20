import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const RscStreamingSimulator: React.FC = () => {
  const [streamStage, setStreamStage] = useState<'shell' | 'data' | 'hydrated'>('shell');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Server Component requested: /dashboard' }
  ]);

  const advanceStream = () => {
    if (streamStage === 'shell') {
      setStreamStage('data');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'output', text: 'Stream 0: Initial HTML shell sent. Suspense fallback rendered.' },
        { id: (Date.now() + 1).toString(), type: 'system', text: 'React Flight chunk: 1:I["./Card.js",["default"]] emitted.' }
      ]);
    } else if (streamStage === 'data') {
      setStreamStage('hydrated');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: 'Stream 1: Async database query resolved on server. HTML replacement streamed.' },
        { id: (Date.now() + 1).toString(), type: 'success', text: 'Client: Hydration islands interactive (zero hydration mismatch).' }
      ]);
    } else {
      setStreamStage('shell');
      setLogs([{ id: Date.now().toString(), type: 'system', text: 'Resetting RSC streaming pipeline.' }]);
    }
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 8</span>
          <span className="badge">Next.js 15 / React Flight</span>
        </div>
        <h2 className="sim-title">React Server Components & Streaming SSR</h2>
        <p className="sim-desc">
          Server Components execute exclusively on the server, sending serialized Flight protocol payloads over HTTP chunks.
          Client components hydrate only their interactive islands.
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={advanceStream}>
          {streamStage === 'shell' ? '▶ Stream HTML Shell' : streamStage === 'data' ? '▶ Stream Async Data Chunk' : 'Reset Stream'}
        </button>
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">Server Environment (Zero JS Bundle to Client)</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-purple)' }}>
            Database Direct Fetch: SELECT * FROM orders;
          </p>
          <span className="badge active" style={{ marginTop: 8 }}>Executed on Server</span>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">Client Browser View ({streamStage})</div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.4)', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {streamStage === 'shell' && <span style={{ color: 'var(--text-muted)' }}>[Suspense Skeleton Loader...]</span>}
            {streamStage === 'data' && <span style={{ color: 'var(--accent-cyan)' }}>[Data Arrived: 142 Orders]</span>}
            {streamStage === 'hydrated' && <span style={{ color: 'var(--accent-emerald)' }}>✓ Interactive Client Islands Hydrated</span>}
          </div>
        </div>
      </div>

      <TerminalPane logs={logs} title="React Flight Payload Protocol Stream" />
    </div>
  );
};
