import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

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
    concept: 'Using an eager join (e.g. Prisma include: { posts: true }) compiles into a single SQL query: SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id. Round-trips drop from 11 down to 1!',
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
    concept: 'DataLoader collects individual requests during the current JavaScript microtask. When the tick finishes, it merges them into a single query: SELECT * FROM posts WHERE user_id IN (1, 2, ..., 10). Total trips: 2.',
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
  const [poolUtilization, setPoolUtilization] = useState<number>(10);

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
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Visual ORM Execution & Companion Controls */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live ORM Query Visualizer & Connection Pool */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  ORM Query Pipeline &amp; Connection Pool
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Measuring network round-trips and DB connection acquisition overhead.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-indigo">{strategy.toUpperCase()}</span>
                <span className="badge">{totalRoundTrips} Round-Trips</span>
              </div>
            </div>

            {/* Performance KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Round-Trips</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: totalRoundTrips > 2 ? '#dc2626' : '#059669' }}>
                  {totalRoundTrips} Trips
                </div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Latency</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: totalLatencyMs > 50 ? '#dc2626' : '#2563eb' }}>
                  {totalLatencyMs} ms
                </div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Pool Saturation</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: poolUtilization > 50 ? '#dc2626' : '#059669' }}>
                  {poolUtilization}%
                </div>
              </div>
            </div>

            {/* Live Query Log */}
            <div style={{ background: '#0f172a', borderRadius: 10, padding: 12, flex: 1, minHeight: 140, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#f8fafc' }}>
              <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 700 }}>Generated SQL Execution Trace:</div>
              {queriesExecuted.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                  Select an ORM fetching strategy and click "Run Simulation".
                </div>
              ) : (
                queriesExecuted.map((q, idx) => (
                  <div key={idx} style={{ color: '#38bdf8', marginBottom: 2 }}>
                    {q}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact DB Terminal & Strategy Controls */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {ORM_LEVELS.map((lvl, idx) => (
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

              {/* Strategy Selector */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Select ORM Fetch Strategy:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { key: 'naive', label: 'Naive Loop (N+1)' },
                    { key: 'eager', label: 'Eager SQL JOIN' },
                    { key: 'dataloader', label: 'DataLoader Batching' }
                  ].map(item => (
                    <button
                      key={item.key}
                      className={`btn btn-sm ${strategy === item.key ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setStrategy(item.key as any)}
                      style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: 11 }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={runSimulation} style={{ fontSize: 11, padding: '4px 10px' }}>
                  Run Simulation
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

            {/* Compact Authentic macOS DB Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  DATABASE CONNECTION POOL MONITOR
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {queriesExecuted.length === 0 ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    Pool idle (2/10 connections acquired). Click "Run Simulation".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="terminal-line" style={{ color: '#38bdf8' }}>
                      <span className="glyph">→</span>
                      <span>Dispatched strategy: {strategy.toUpperCase()}</span>
                    </div>
                    <div className="terminal-line" style={{ color: totalRoundTrips > 2 ? '#f87171' : '#4ade80' }}>
                      <span className="glyph">{totalRoundTrips > 2 ? '✗' : '✓'}</span>
                      <span>Network trips: {totalRoundTrips} | Latency: {totalLatencyMs}ms</span>
                    </div>
                    <div className="terminal-line" style={{ color: '#cbd5e1' }}>
                      <span className="glyph">•</span>
                      <span>Pool saturation: {poolUtilization}% ({Math.round(poolUtilization / 10)}/10 active sockets)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Level Completion Status */}
            {levelWon && (
              <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 12 }}>Level Completed!</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered {strategy} query execution.</div>
                </div>
                {levelIdx < ORM_LEVELS.length - 1 ? (
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
        {/* Left Card: ORM Query Performance Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            High-Performance Data Access
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The N+1 Query Architectural Disease
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Connection Pool Depletion Formula:</div>
            <div>Active Connections = Concurrent Users × Queries Per Request</div>
            <div>• Naive (11 queries): 100 users × 11 = 1,100 sockets (Pool Starvation)</div>
            <div>• Eager (1 query):     100 users × 1  = 100 sockets (Healthy)</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The 100x Database Pool Exhaustion
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> ORM abstractions (like ActiveRecord or Prisma) hide raw database network calls behind convenient JavaScript property getters. Calling a relation property inside a loop silently generates N network round-trips that saturate connection pools.
          </div>
        </div>
      </div>
    </div>
  );
};
