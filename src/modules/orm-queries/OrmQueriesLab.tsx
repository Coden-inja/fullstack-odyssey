import React, { useState, useEffect } from 'react';

interface OrmLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  targetStrategy: 'naive' | 'eager' | 'dataloader';
  expectedMaxRoundTrips: number;
}

const ORM_LEVELS: OrmLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Loop Trap (N+1 Queries)',
    subtitle: 'Why for-loops slow down databases',
    story: 'You fetch 10 users to display on a leaderboard. Then, inside a for-loop, you fetch each user’s latest post. Why did your page load feel sluggish?',
    concept: '1 query for the users + 10 separate queries for their posts = 11 round-trips over the network! Each round-trip adds network latency.',
    goalDescription: 'Select "Naive Loop (N+1)" and click "Run Simulation" to see the 11 round-trips fire sequentially.',
    hint: 'Select the Naive Loop option and click Run Simulation.',
    targetStrategy: 'naive',
    expectedMaxRoundTrips: 11
  },
  {
    id: 2,
    title: 'Level 2: Fixing with Eager SQL JOIN',
    subtitle: 'Combining Queries on the Database',
    story: 'Instead of making 11 separate trips, can the database do the work in a single query?',
    concept: 'Using an eager join (e.g. Prisma `include: { posts: true }`) compiles into a single SQL query: `SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id`. Round-trips drop from 11 down to 1!',
    goalDescription: 'Select "Eager SQL JOIN" and observe all data fetched in just 1 single round-trip.',
    hint: 'Select Eager SQL JOIN and run the simulation.',
    targetStrategy: 'eager',
    expectedMaxRoundTrips: 1
  },
  {
    id: 3,
    title: 'Level 3: Microtask Batching (DataLoader)',
    subtitle: 'How GraphQL & ORMs Automate the Fix',
    story: 'What if different parts of your code request posts independently? You can’t always write a giant custom SQL join.',
    concept: 'DataLoader collects individual requests during the current JavaScript microtask. When the tick finishes, it merges them into a single query: `SELECT * FROM posts WHERE user_id IN (1, 2, ..., 10)`. Total trips: 2.',
    goalDescription: 'Select "DataLoader Batching" and observe 10 loop requests automatically collapse into a single WHERE IN query.',
    hint: 'Select DataLoader Batching and run simulation.',
    targetStrategy: 'dataloader',
    expectedMaxRoundTrips: 2
  }
];

export const OrmQueriesLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = ORM_LEVELS[levelIdx];

  const [strategy, setStrategy] = useState<'naive' | 'eager' | 'dataloader'>('naive');
  const [queriesExecuted, setQueriesExecuted] = useState<string[]>([]);
  const [totalRoundTrips, setTotalRoundTrips] = useState<number>(0);
  const [totalLatencyMs, setTotalLatencyMs] = useState<number>(0);
  const [poolUtilization, setPoolUtilization] = useState<number>(10); // percent

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon && queriesExecuted.length > 0 && strategy === currentLevel.targetStrategy) {
      setLevelWon(true);
      saveModuleCompletion();
    }
  }, [queriesExecuted, strategy, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('orm-queries')) {
        list.push('orm-queries');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    const l = ORM_LEVELS[idx];
    setStrategy(l.targetStrategy);
    setQueriesExecuted([]);
    setTotalRoundTrips(0);
    setTotalLatencyMs(0);
    setPoolUtilization(10);
    setShowHint(false);
    setLevelWon(false);
  };

  const runSimulation = () => {
    const list: string[] = [];

    if (strategy === 'naive') {
      list.push('1. SELECT * FROM users LIMIT 10; [15ms]');
      for (let i = 1; i <= 10; i++) {
        list.push(`${i + 1}. SELECT * FROM posts WHERE user_id = ${i}; [15ms]`);
      }
      setQueriesExecuted(list);
      setTotalRoundTrips(11);
      setTotalLatencyMs(165);
      setPoolUtilization(80);
    } else if (strategy === 'eager') {
      list.push('1. SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id LIMIT 10; [18ms]');
      setQueriesExecuted(list);
      setTotalRoundTrips(1);
      setTotalLatencyMs(18);
      setPoolUtilization(20);
    } else if (strategy === 'dataloader') {
      list.push('1. SELECT * FROM users LIMIT 10; [15ms]');
      list.push('2. SELECT * FROM posts WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10); [16ms]');
      setQueriesExecuted(list);
      setTotalRoundTrips(2);
      setTotalLatencyMs(31);
      setPoolUtilization(25);
    }
  };

  const autoPlaySolution = () => {
    setStrategy(currentLevel.targetStrategy);
    setTimeout(() => {
      runSimulation();
    }, 300);
  };

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ORM_LEVELS.map((lvl, idx) => (
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

          {/* Strategy Selection */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Query Strategy:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="strat"
                  checked={strategy === 'naive'}
                  onChange={() => setStrategy('naive')}
                />
                Naive Loop (N+1 Queries)
              </label>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="strat"
                  checked={strategy === 'eager'}
                  onChange={() => setStrategy('eager')}
                />
                Eager SQL JOIN (Single Combined Query)
              </label>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="strat"
                  checked={strategy === 'dataloader'}
                  onChange={() => setStrategy('dataloader')}
                />
                DataLoader Batching (WHERE user_id IN (...))
              </label>
            </div>
          </div>

          <div className="lesson-actions">
            <button className="btn btn-primary btn-sm" onClick={runSimulation}>
              Run Simulation →
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered query batching and latency optimization.</div>
            </div>
            {levelIdx < ORM_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Network Waterfall & Pool Visualizer */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">Database Network Waterfall & Connection Metrics</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Compare round-trip latency and connection pool pressure across query strategies.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge ${totalRoundTrips > 2 ? 'badge-danger' : 'badge-success'}`}>
              Round-trips: {totalRoundTrips}
            </span>
            <span className="badge">Total Latency: {totalLatencyMs}ms</span>
          </div>
        </div>

        {/* Connection Pool Gauge */}
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>Database Connection Pool Saturation:</span>
            <span style={{ fontWeight: 700, color: poolUtilization > 50 ? 'var(--danger)' : 'var(--success)' }}>
              {poolUtilization}% (Max: 10 Conns)
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${poolUtilization}%`,
                height: '100%',
                background: poolUtilization > 50 ? 'var(--danger)' : 'var(--success)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Network Waterfall Execution List */}
        <div style={{ flex: 1, background: '#0f172a', padding: 16, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc', overflowY: 'auto' }}>
          <div style={{ color: '#38bdf8', marginBottom: 8, fontWeight: 700 }}>Compiled SQL Statements Dispatched to Database:</div>
          {queriesExecuted.length === 0 ? (
            <div style={{ color: '#64748b' }}>Click "Run Simulation" to observe SQL compilation and network dispatch</div>
          ) : (
            queriesExecuted.map((q, idx) => (
              <div key={idx} style={{ padding: '3px 0', color: q.includes('IN (') ? '#34d399' : q.includes('JOIN') ? '#818cf8' : '#e2e8f0', borderBottom: '1px solid #1e293b' }}>
                {q}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
