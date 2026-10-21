import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

interface PipelineStage {
  id: string;
  name: string;
  command: string;
  durationMs: number;
  status: 'idle' | 'running' | 'success' | 'failed';
  layerCached?: boolean;
}

export const CicdPipelineLab: React.FC = () => {
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'checkout', name: '1. Checkout & Cache Hydration', command: 'actions/cache@v4 (Restore pnpm store)', durationMs: 400, status: 'idle', layerCached: true },
    { id: 'typecheck', name: '2. Shift-Left Typecheck', command: 'tsc --noEmit (Strict AST analysis)', durationMs: 600, status: 'idle' },
    { id: 'test', name: '3. Matrix Unit & Integration Tests', command: 'vitest run --coverage (Node 20, 22)', durationMs: 800, status: 'idle' },
    { id: 'docker', name: '4. Docker Multi-Stage Build', command: 'docker buildx --cache-from=type=gha', durationMs: 1100, status: 'idle', layerCached: true },
    { id: 'deploy', name: '5. Vercel Anycast Edge Promotion', command: 'vercel deploy --prod (Traffic flip)', durationMs: 700, status: 'idle' }
  ]);

  const [dockerfileMode, setDockerfileMode] = useState<'optimized' | 'naive'>('optimized');
  const [simulateTestFailure, setSimulateTestFailure] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenges
  const [achievedCacheOptimization, setAchievedCacheOptimization] = useState<boolean>(false);
  const [achievedShiftLeftAbort, setAchievedShiftLeftAbort] = useState<boolean>(false);
  const [achievedEdgePromotion, setAchievedEdgePromotion] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'GitHub Actions Runner [ubuntu-24.04-x64] provisioned.' },
    { id: '2', type: 'output', text: 'Workflow .github/workflows/deploy.yml ready to evaluate push event.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('cicd-pipeline')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const triggerPipeline = async () => {
    setIsRunning(true);
    const timestamp = Date.now();

    // Reset stages
    setStages(prev => prev.map(s => ({ ...s, status: 'idle' })));
    setLogs([
      { id: timestamp.toString(), type: 'system', text: `$ git push origin main -> SHA: 55491ca` },
      { id: (timestamp + 1).toString(), type: 'output', text: `Triggered job: release-edge on commit 55491ca` }
    ]);

    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      setActiveStageId(st.id);

      // Set to running
      setStages(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      setLogs(p => [
        ...p,
        { id: (Date.now() + i).toString(), type: 'system', text: `--> [Stage ${i + 1}/5] Running: ${st.command}` }
      ]);

      // Execution latency: Docker stage is much slower if naive
      const delay = st.id === 'docker' && dockerfileMode === 'naive' ? 1800 : st.durationMs;
      await new Promise(r => setTimeout(r, delay));

      // Simulate failure in test stage if toggled
      if (st.id === 'test' && simulateTestFailure) {
        setStages(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'failed' } : s));
        setAchievedShiftLeftAbort(true);
        setLogs(p => [
          ...p,
          { id: Date.now().toString(), type: 'error', text: `FAIL: Vitest: 1 of 42 suites failed (auth.test.ts: Expected 401, received 200).` },
          { id: (Date.now() + 1).toString(), type: 'error', text: `🚨 PIPELINE ABORTED: Shift-left invariant preserved. Zero broken artifacts reached production!` }
        ]);
        setIsRunning(false);
        setActiveStageId(null);
        return;
      }

      // Mark success
      setStages(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));

      if (st.id === 'docker') {
        if (dockerfileMode === 'optimized') {
          setAchievedCacheOptimization(true);
          setLogs(p => [
            ...p,
            { id: Date.now().toString(), type: 'success', text: `Docker: CACHED [2/4] COPY package.json pnpm-lock.yaml -> 0.2s.` },
            { id: (Date.now() + 1).toString(), type: 'success', text: `Multi-stage build complete: Runner distroless image size: 48 MB (Reduced from 1.2 GB).` }
          ]);
        } else {
          setLogs(p => [
            ...p,
            { id: Date.now().toString(), type: 'output', text: `Docker: CACHE MISS! COPY . . invalidated package cache. Full pnpm install took 12.8s.` }
          ]);
        }
      }

      if (st.id === 'deploy') {
        setAchievedEdgePromotion(true);
        setLogs(p => [
          ...p,
          { id: Date.now().toString(), type: 'success', text: `🎉 Vercel Production Deployment: https://fullstack-odyssey.vercel.app [HTTP 200 OK]` },
          { id: (Date.now() + 1).toString(), type: 'success', text: `Anycast BGP updated across 300+ Edge POPs. Zero dropped TCP connections.` }
        ]);
      }
    }

    setIsRunning(false);
    setActiveStageId(null);
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('cicd-pipeline')) {
        list.push('cicd-pipeline');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 10 (CI/CD Pipeline & Edge Deploy) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Shift-Left Gate & Docker Layer Invariant</span>
            <span className="badge badge-indigo">Module 10</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Modern deployment pipelines enforce two foundational invariants:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 10, fontSize: 12 }}>
            <div style={{ background: '#040711', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--indigo)' }}>Shift-Left Testing</strong>
              <p style={{ color: 'var(--text-dim)', marginTop: 2 }}>Fail fast in static analysis before provisioning heavy container instances.</p>
            </div>
            <div style={{ background: '#040711', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--emerald)' }}>Layer Caching</strong>
              <p style={{ color: 'var(--text-dim)', marginTop: 2 }}>Separate lockfile dependencies from app code so dependency installs are cached.</p>
            </div>
          </div>
        </div>

        {/* Pipeline Runner Controls */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Workflow Trigger & Environment Config</span>
            <span className={`badge ${isRunning ? 'badge-amber' : 'badge-emerald'}`}>
              {isRunning ? 'Pipeline Running...' : 'Ready'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dockerfile Layer Architecture:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 4 }}>
                <button
                  className={`btn ${dockerfileMode === 'optimized' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setDockerfileMode('optimized')}
                  style={{ fontSize: 11, justifyContent: 'center' }}
                >
                  Optimized (Multi-Stage)
                </button>
                <button
                  className={`btn ${dockerfileMode === 'naive' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setDockerfileMode('naive')}
                  style={{ fontSize: 11, justifyContent: 'center' }}
                >
                  Naive (Cache-Busted)
                </button>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={simulateTestFailure}
                onChange={(e) => setSimulateTestFailure(e.target.checked)}
              />
              <span>Simulate Test Suite Failure (Trigger Shift-Left Abort)</span>
            </label>

            <button
              className="btn btn-primary"
              disabled={isRunning}
              onClick={triggerPipeline}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {isRunning ? 'Executing GitHub Actions Runner...' : '🚀 Trigger Git Push & Workflow Run'}
            </button>
          </div>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>CI/CD Pipeline Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedCacheOptimization ? '✅' : '⏳'}</span>
              <span>Leverage Docker multi-stage layer caching for sub-3s builds</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedShiftLeftAbort ? '✅' : '⏳'}</span>
              <span>Catch regression early & abort pipeline before deployment</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedEdgePromotion ? '✅' : '⏳'}</span>
              <span>Execute zero-downtime Anycast traffic flip to live Edge nodes</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedCacheOptimization && achievedEdgePromotion ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedCacheOptimization || !achievedEdgePromotion}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 10 Mastered (Full Curriculum 100%!)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="GitHub Actions Runner Trace" />
      </div>

      {/* Right Column: Visual Stage Pipeline & Dockerfile Inspector */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>GitHub Actions Workflow Stages</span>
            <span className="badge badge-emerald">.github/workflows/deploy.yml</span>
          </div>

          {/* 5 Pipeline Stages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {stages.map((st) => {
              const isCurrent = activeStageId === st.id;
              const isPassed = st.status === 'success';
              const isFailed = st.status === 'failed';

              return (
                <div
                  key={st.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: isFailed ? 'rgba(244, 63, 94, 0.15)' : isPassed ? 'rgba(16, 185, 129, 0.1)' : isCurrent ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isFailed ? 'var(--rose)' : isPassed ? 'rgba(16, 185, 129, 0.4)' : isCurrent ? 'var(--indigo)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: isFailed ? 'var(--rose)' : isPassed ? 'var(--emerald)' : isCurrent ? '#fff' : 'var(--text-muted)' }}>
                        {st.name}
                      </strong>
                      {st.layerCached && dockerfileMode === 'optimized' && isPassed && (
                        <span className="badge badge-emerald" style={{ fontSize: 9 }}>Layer Cached</span>
                      )}
                    </div>
                    <code style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, display: 'block' }}>
                      {st.command}
                    </code>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      {st.id === 'docker' && dockerfileMode === 'naive' ? '1800ms' : `${st.durationMs}ms`}
                    </span>
                    <span className={`badge ${isFailed ? 'badge-rose' : isPassed ? 'badge-emerald' : isCurrent ? 'badge-amber' : ''}`}>
                      {isFailed ? '✕ Failed' : isPassed ? '✓ Passed' : isCurrent ? 'Running...' : 'Waiting'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dockerfile Multi-Stage Blueprint */}
          <div className="lab-card" style={{ background: '#040711' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: 'var(--cyan)' }}>
                {dockerfileMode === 'optimized' ? 'Production Multi-Stage Dockerfile (Cache-Optimized)' : 'Naive Dockerfile (Cache-Busted Anti-Pattern)'}
              </strong>
              <span className={`badge ${dockerfileMode === 'optimized' ? 'badge-emerald' : 'badge-rose'}`}>
                {dockerfileMode === 'optimized' ? 'Image: 48 MB' : 'Image: 1.2 GB'}
              </span>
            </div>

            <pre style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '12px 14px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: dockerfileMode === 'optimized' ? '#a5b4fc' : 'var(--rose)',
              lineHeight: 1.5,
              overflowX: 'auto'
            }}>
{dockerfileMode === 'optimized' ? `# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder
WORKDIR /app
# ✅ Cache Invariant: Copy manifests first
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ✅ Copy source only after deps cached
COPY . .
RUN pnpm build

# Stage 2: Distroless Minimal Runtime
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["dist/index.js"]` : `# ❌ ANTI-PATTERN: Copy all source before install
FROM node:22
WORKDIR /app
# Every 1-character code edit busts dependency cache!
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};
