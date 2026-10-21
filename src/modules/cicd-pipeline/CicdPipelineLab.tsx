import React, { useState, useEffect } from 'react';

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

    // Step 1: Typecheck
    setTimeout(() => {
      setPipelineSteps(prev => [
        { ...prev[0], status: 'passed' },
        { ...prev[1], status: 'running' },
        prev[2],
        prev[3]
      ]);

      // Step 2: Tests
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

        // Step 3: Docker Build
        setTimeout(() => {
          setPipelineSteps(prev => [
            prev[0],
            prev[1],
            { ...prev[2], status: 'passed' },
            { ...prev[3], status: 'running' }
          ]);

          // Step 4: Edge Cutover
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
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CICD_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              className={`btn btn-sm ${levelIdx === idx ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setLevelIdx(idx)}
            >
              Level {lvl.id}
            </button>
          ))}
        </div>

        <div className="lesson-card" style={{ marginBottom: 0 }}>
          <div className="lesson-step-header">
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {currentLevel.subtitle}
              </div>
              <h2 className="lesson-step-title">{currentLevel.title}</h2>
            </div>
            {levelWon && <span className="badge badge-success">Passed</span>}
          </div>

          <p className="lesson-explanation">{currentLevel.story}</p>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            <strong style={{ color: 'var(--text-main)' }}>Key Concept: </strong>
            {currentLevel.concept}
          </div>

          <div className="lesson-goal-box">
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Your Objective:</div>
              <div>{currentLevel.goalDescription}</div>
            </div>
          </div>

          {/* Interactive Pipeline Toggles */}
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
              />
              Simulate Broken Test (Quality Gate Trigger)
            </label>
            <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
              />
              Use Docker Layer Caching (Fast Builds)
            </label>
          </div>

          <div className="lesson-actions">
            <button className="btn btn-primary btn-sm" onClick={runPipeline}>
              Run Pipeline →
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowHint(!showHint)}>
              {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={autoPlaySolution}>
              Show Solution
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => resetLevel(levelIdx)}>
              Reset
            </button>
          </div>

          {showHint && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
              <strong>Hint: </strong>{currentLevel.hint}
            </div>
          )}
        </div>

        {levelWon && (
          <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: 14, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>Level Completed!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered automated quality gates and zero-downtime cutovers.</div>
            </div>
            {levelIdx < CICD_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Pipeline & Edge Cutover Visualizer */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">GitHub Actions Pipeline & Edge Distribution</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Watch sequential quality checks execute and route traffic to healthy instances.
            </div>
          </div>
          <div>
            <span className={`badge ${activeDeployment === 'B' ? 'badge-success' : 'badge-indigo'}`}>
              Active Version: {activeDeployment === 'B' ? 'v2.0 (New)' : 'v1.0 (Live)'}
            </span>
          </div>
        </div>

        {/* Step-by-Step Pipeline Boxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {pipelineSteps.map((step) => {
            const isPassed = step.status === 'passed';
            const isRunning = step.status === 'running';
            const isFailed = step.status === 'failed';

            return (
              <div
                key={step.name}
                style={{
                  background: isRunning ? 'var(--primary-light)' : isPassed ? 'var(--success-light)' : isFailed ? 'var(--danger-light)' : '#ffffff',
                  border: `1px solid ${isRunning ? 'var(--primary)' : isPassed ? 'var(--success-border)' : isFailed ? 'var(--danger-border)' : 'var(--border-light)'}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: isFailed ? 'var(--danger)' : isPassed ? 'var(--success)' : 'var(--text-main)' }}>
                    {step.name}
                  </span>
                </div>

                <div>
                  {isRunning && <span className="badge badge-indigo">Running...</span>}
                  {isPassed && <span className="badge badge-success">Passed ✓</span>}
                  {isFailed && <span className="badge badge-danger">Halted: Test Failed ✕</span>}
                  {step.status === 'idle' && <span className="badge">Waiting</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Anycast Traffic Status */}
        <div style={{ background: '#0f172a', padding: 16, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc' }}>
          <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Edge Anycast Routing Engine:</div>
          <div style={{ color: '#e2e8f0', marginBottom: 4 }}>
            Status: <span style={{ color: activeDeployment === 'B' ? '#34d399' : '#38bdf8', fontWeight: 600 }}>{trafficDistribution}</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>
            Global Edge Points (SFO, LHR, HND, SYD) verified healthy. Zero dropped TCP packets.
          </div>
        </div>
      </div>
    </div>
  );
};
