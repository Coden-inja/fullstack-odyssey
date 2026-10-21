import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface CicdLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  targetOutcome: string;
}

const CICD_LEVELS: CicdLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Safety Gate',
    subtitle: 'Catching Bugs Before They Hit Production',
    story: 'What prevents a developer from accidentally deploying broken code to real customers on a Friday evening?',
    concept: 'A CI pipeline runs automated quality checks: 1) Type checking (tsc --noEmit), 2) Automated Unit Tests. If even ONE test fails, the pipeline immediately halts. Broken code is never built or deployed.',
    goalDescription: 'Turn "Simulate Broken Test" ON, run the pipeline, and watch the quality gate abort the deployment before reaching production.',
    hint: 'Enable "Simulate Broken Test" and click "Run Pipeline".',
    targetOutcome: 'aborted'
  },
  {
    id: 2,
    title: 'Level 2: Docker Layer Caching',
    subtitle: 'From 5 Minutes Down to 4 Seconds',
    story: 'Why re-download all 500MB of node_modules every time you fix a single typo in a CSS file?',
    concept: 'Docker caches image layers in order. By copying package.json and running npm install BEFORE copying your source code, Docker reuses the cached layer (CACHED) unless you added a new package.',
    goalDescription: 'Turn "Use Layer Cache" ON, run the Docker build, and observe all layers hit the cache in 4 seconds.',
    hint: 'Ensure layer cache is enabled and run the build.',
    targetOutcome: 'cached'
  },
  {
    id: 3,
    title: 'Level 3: Zero-Downtime Rollout',
    subtitle: 'Instant Edge Cutover Without Dropping Connections',
    story: 'When you deploy a new version of your website, do users see a 502 Bad Gateway while the server restarts?',
    concept: 'Zero-Downtime Deployment: The new deployment boots up and verifies its health check FIRST. Once healthy, the edge router flips traffic to the new version with zero dropped connections.',
    goalDescription: 'Run the production rollout, watch the health check pass, and see edge traffic flip seamlessly to the new deployment.',
    hint: 'Run the production rollout to complete the final cutover.',
    targetOutcome: 'cutover'
  }
];

export const CicdPipelineLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = CICD_LEVELS[levelIdx];

  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [useCache, setUseCache] = useState<boolean>(true);
  const [pipelineSteps, setPipelineSteps] = useState<{ name: string; status: 'idle' | 'running' | 'passed' | 'failed' }[]>([
    { name: '1. Typecheck (tsc --noEmit)', status: 'idle' },
    { name: '2. Unit Tests (vitest run)', status: 'idle' },
    { name: '3. Docker Multi-Stage Build', status: 'idle' },
    { name: '4. Edge Traffic Cutover', status: 'idle' }
  ]);

  const [activeDeployment, setActiveDeployment] = useState<'A' | 'B'>('A');
  const [trafficDistribution, setTrafficDistribution] = useState<string>('100% on Deployment A (v1.0)');

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon) {
      const isFailed = pipelineSteps[1].status === 'failed';
      const isAllPassed = pipelineSteps.every(s => s.status === 'passed');

      if (currentLevel.id === 1 && isFailed) {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 2 && isAllPassed && useCache) {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 3 && activeDeployment === 'B') {
        setLevelWon(true);
        saveModuleCompletion();
      }
    }
  }, [pipelineSteps, activeDeployment, useCache, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('cicd-pipeline')) {
        list.push('cicd-pipeline');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    setSimulateFailure(idx === 0);
    setUseCache(true);
    setActiveDeployment('A');
    setTrafficDistribution('100% on Deployment A (v1.0)');
    setPipelineSteps([
      { name: '1. Typecheck (tsc --noEmit)', status: 'idle' },
      { name: '2. Unit Tests (vitest run)', status: 'idle' },
      { name: '3. Docker Multi-Stage Build', status: 'idle' },
      { name: '4. Edge Traffic Cutover', status: 'idle' }
    ]);
    setShowHint(false);
    setLevelWon(false);
  };

  const runPipeline = () => {
    setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    setTimeout(() => {
      setPipelineSteps(prev => [
        { ...prev[0], status: 'passed' },
        { ...prev[1], status: 'running' },
        prev[2],
        prev[3]
      ]);

      setTimeout(() => {
        if (simulateFailure) {
          setPipelineSteps(prev => [
            prev[0],
            { ...prev[1], status: 'failed' },
            { ...prev[2], status: 'idle' },
            { ...prev[3], status: 'idle' }
          ]);
          return;
        }

        setPipelineSteps(prev => [
          prev[0],
          { ...prev[1], status: 'passed' },
          { ...prev[2], status: 'running' },
          prev[3]
        ]);

        setTimeout(() => {
          setPipelineSteps(prev => [
            prev[0],
            prev[1],
            { ...prev[2], status: 'passed' },
            { ...prev[3], status: 'running' }
          ]);

          setTimeout(() => {
            setPipelineSteps(prev => [
              prev[0],
              prev[1],
              prev[2],
              { ...prev[3], status: 'passed' }
            ]);
            setActiveDeployment('B');
            setTrafficDistribution('100% on Deployment B (v2.0) - Zero Downtime');
          }, 800);
        }, 800);
      }, 800);
    }, 400);
  };

  const autoPlaySolution = () => {
    resetLevel(levelIdx);
    setTimeout(() => {
      if (currentLevel.id === 1) {
        setSimulateFailure(true);
      } else {
        setSimulateFailure(false);
      }
      setTimeout(() => runPipeline(), 300);
    }, 200);
  };

  return (
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Visual Pipeline DAG & Companion Runner Controls */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live Pipeline Stages & Traffic Cutover */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  GitHub Actions CI/CD Pipeline &amp; Edge Router
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Automated test gates, Docker build cache, and zero-downtime blue/green cutover.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-indigo">Ubuntu Runner</span>
                <span className="badge">{trafficDistribution}</span>
              </div>
            </div>

            {/* Pipeline Stage Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {pipelineSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: step.status === 'passed' ? '#ecfdf5' : step.status === 'failed' ? '#fee2e2' : step.status === 'running' ? '#fef3c7' : '#ffffff',
                    border: `1.5px solid ${step.status === 'passed' ? '#10b981' : step.status === 'failed' ? '#ef4444' : step.status === 'running' ? '#f59e0b' : 'var(--border-light)'}`,
                    borderRadius: 8,
                    padding: 8,
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                    {step.name}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: step.status === 'passed' ? '#059669' : step.status === 'failed' ? '#dc2626' : step.status === 'running' ? '#d97706' : 'var(--text-dim)' }}>
                    {step.status === 'running' ? 'Running...' : step.status}
                  </div>
                </div>
              ))}
            </div>

            {/* Edge Deployment Switcher Visualizer */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-main)' }}>Edge Traffic Router</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trafficDistribution}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`badge ${activeDeployment === 'A' ? 'badge-indigo' : ''}`} style={{ fontSize: 10 }}>Deploy A (v1.0)</span>
                <span className={`badge ${activeDeployment === 'B' ? 'badge-success' : ''}`} style={{ fontSize: 10 }}>Deploy B (v2.0)</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact Runner Terminal & Actions */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {CICD_LEVELS.map((lvl, idx) => (
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

              {/* Toggles */}
              {currentLevel.id === 1 && (
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                  />
                  Simulate Broken Test (throw Error)
                </label>
              )}

              {currentLevel.id === 2 && (
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={useCache}
                    onChange={(e) => setUseCache(e.target.checked)}
                  />
                  Use Docker Layer Cache (CACHED)
                </label>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={runPipeline} style={{ fontSize: 11, padding: '4px 10px' }}>
                  Run Pipeline
                </button>
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

            {/* Compact Authentic macOS Runner Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  GITHUB ACTIONS RUNNER CONSOLE
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {pipelineSteps.every(s => s.status === 'idle') ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    Runner idle. Click "Run Pipeline" above to trigger workflow dispatch.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="terminal-line" style={{ color: '#38bdf8' }}>
                      <span className="glyph">→</span>
                      <span>Run tsc --noEmit: Passed (0 errors)</span>
                    </div>
                    {pipelineSteps[1].status === 'failed' && (
                      <div className="terminal-line" style={{ color: '#f87171' }}>
                        <span className="glyph">✗</span>
                        <span>Vitest: 1 failed (AssertionError). Pipeline aborted!</span>
                      </div>
                    )}
                    {pipelineSteps[1].status === 'passed' && (
                      <div className="terminal-line" style={{ color: '#4ade80' }}>
                        <span className="glyph">✓</span>
                        <span>Vitest: 14/14 tests passed</span>
                      </div>
                    )}
                    {pipelineSteps[2].status === 'passed' && (
                      <div className="terminal-line" style={{ color: '#cbd5e1' }}>
                        <span className="glyph">•</span>
                        <span>Docker build: {useCache ? 'Using cache (4s)' : 'Building layers from scratch (180s)'}</span>
                      </div>
                    )}
                    {pipelineSteps[3].status === 'passed' && (
                      <div className="terminal-line" style={{ color: '#4ade80' }}>
                        <span className="glyph">✓</span>
                        <span>Zero-downtime cutover: 100% traffic on Deployment B</span>
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
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered CI/CD deployment safeguards.</div>
                </div>
                {levelIdx < CICD_LEVELS.length - 1 ? (
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
        {/* Left Card: CI/CD Pipeline Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            DevOps &amp; Infrastructure
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            Deterministic Build Gates &amp; Edge Cutover
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Container Multi-Stage Optimization:</div>
            <div>FROM node:20-alpine AS deps (Layer Cached)</div>
            <div>COPY package.json package-lock.json ./</div>
            <div>RUN npm ci --prefer-offline</div>
            <div>COPY . .</div>
            <div>RUN npm run build</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The Friday Afternoon Outage
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> Deployments should never modify production in-place. Blue/Green and ephemeral container deployments verify health checks on a separate container before the load balancer flips traffic, eliminating 502 Bad Gateway downtime.
          </div>
        </div>
      </div>
    </div>
  );
};
