import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const CicdPipelineLab: React.FC = () => {
  const [stageIndex, setStageIndex] = useState<number>(-1);
  const [stages, setStages] = useState([
    { name: '1. Checkout Repository & Cache', duration: '1.2s', status: 'idle' },
    { name: '2. Typecheck (npx tsc --noEmit)', duration: '0.8s', status: 'idle' },
    { name: '3. Test Matrix [Node 18, 20, 22]', duration: '2.4s', status: 'idle' },
    { name: '4. Docker Build & Layer Caching', duration: '3.1s', status: 'idle' },
    { name: '5. Vercel Global Edge Deploy', duration: '1.5s', status: 'idle' }
  ]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'GitHub Actions: Runner [ubuntu-latest] initialized.' }
  ]);

  const triggerPipeline = () => {
    setStageIndex(0);
    setLogs([
      { id: Date.now().toString(), type: 'system', text: 'git push origin main -> Triggered .github/workflows/deploy.yml' }
    ]);

    stages.forEach((st, idx) => {
      setTimeout(() => {
        setStageIndex(idx);
        setStages(prev => {
          const next = [...prev];
          next[idx].status = 'success';
          return next;
        });
        setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `Stage passed (${st.duration}): ${st.name}` }]);
      }, (idx + 1) * 600);
    });
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">CI/CD Pipeline Runner</div>
          <button className="btn btn-primary" onClick={triggerPipeline} style={{ width: '100%', justifyContent: 'center' }}>
            🚀 Trigger Git Push & Workflow
          </button>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Quality Invariants Verified</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p>✓ Zero broken TypeScript compiler builds (Shift-left).</p>
            <p>✓ Automated parallel matrix execution.</p>
            <p>✓ Edge cache invalidation across 300+ global nodes.</p>
          </div>
        </div>

        <TerminalPane logs={logs} title="GitHub Actions Runner Trace" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>GitHub Actions Workflow Stages</span>
            <span className={`badge ${stageIndex >= 4 ? 'badge-emerald' : 'badge-indigo'}`}>
              {stageIndex >= 4 ? '✓ All Stages Passed' : stageIndex >= 0 ? 'Executing...' : 'Idle'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stages.map((st, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: st.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${st.status === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: st.status === 'success' ? 'var(--emerald)' : '#fff' }}>
                    {st.name}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{st.duration}</span>
                  <span className={`badge ${st.status === 'success' ? 'badge-emerald' : ''}`}>
                    {st.status === 'success' ? '✓ Passed' : 'Waiting'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
