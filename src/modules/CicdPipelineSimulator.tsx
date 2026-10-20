import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const CicdPipelineSimulator: React.FC = () => {
  const [stages, setStages] = useState([
    { name: '1. Checkout & Cache', status: 'idle' },
    { name: '2. Typecheck (tsc --noEmit)', status: 'idle' },
    { name: '3. Unit Tests (vitest)', status: 'idle' },
    { name: '4. Docker Build & Layer Cache', status: 'idle' },
    { name: '5. Vercel Edge Deploy', status: 'idle' }
  ]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'GitHub Actions runner ready: ubuntu-latest' }
  ]);

  const runPipeline = () => {
    setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: 'git push origin main triggered .github/workflows/deploy.yml' }]);

    stages.forEach((s, idx) => {
      setTimeout(() => {
        setStages(prev => {
          const next = [...prev];
          next[idx].status = 'success';
          return next;
        });
        setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `Stage completed: ${s.name}` }]);
      }, (idx + 1) * 400);
    });
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 10</span>
          <span className="badge">DevOps & Edge Infrastructure</span>
        </div>
        <h2 className="sim-title">CI/CD Pipeline & Edge Deployment</h2>
        <p className="sim-desc">
          Automate zero-trust quality gates: TypeScript verification, containerization, and edge distribution to 300+ global points of presence.
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={runPipeline}>🚀 Trigger Push to Production</button>
        <button className="btn btn-secondary" onClick={() => setStages(stages.map(s => ({ ...s, status: 'idle' })))}>Reset Pipeline</button>
      </div>

      <div className="vis-grid">
        {stages.map((st, i) => (
          <div key={i} className="vis-card" style={{ borderColor: st.status === 'success' ? 'var(--accent-emerald)' : 'var(--border-color)' }}>
            <div className="vis-card-title">{st.name}</div>
            <span className={`badge ${st.status === 'success' ? 'active' : ''}`}>
              {st.status === 'success' ? '✓ Passed (0s)' : 'Waiting'}
            </span>
          </div>
        ))}
      </div>

      <TerminalPane logs={logs} title="GitHub Actions Workflow Traces" />
    </div>
  );
};
