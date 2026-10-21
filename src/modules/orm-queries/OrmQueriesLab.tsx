import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

type FetchStrategy = 'naive-loop' | 'dataloader-batch' | 'eager-join';

export const OrmQueriesLab: React.FC = () => {
  const [parentCount, setParentCount] = useState<number>(10);
  const [strategy, setStrategy] = useState<FetchStrategy>('naive-loop');
  const [poolSize] = useState<number>(10); // Standard DB pool size
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenge tracking
  const [achievedStarvation, setAchievedStarvation] = useState<boolean>(false);
  const [achievedBatching, setAchievedBatching] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Database engine (PostgreSQL 16) connected. Max pool size: 10 connections.' },
    { id: '2', type: 'output', text: 'Select query strategy and inspect connection pool saturation and query count.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('orm-queries')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  // Compute metrics based on strategy
  const queryCount = strategy === 'naive-loop' ? 1 + parentCount : strategy === 'dataloader-batch' ? 2 : 1;
  const estimatedLatencyMs = strategy === 'naive-loop' ? 4 + parentCount * 5 : strategy === 'dataloader-batch' ? 9 : 6;
  const poolSaturationPercent = Math.min(100, Math.round((strategy === 'naive-loop' ? Math.min(poolSize, parentCount) / poolSize : 1 / poolSize) * 100));

  const runSimulation = () => {
    setIsExecuting(true);
    const start = Date.now();

    if (strategy === 'naive-loop') {
      const conns = Math.min(poolSize, parentCount);
      setActiveConnections(conns);

      setLogs([
        { id: start.toString(), type: 'system', text: `Executing Naive ORM loop: for (const u of users) await prisma.post.findMany(...)` },
        { id: (start + 1).toString(), type: 'output', text: `Query [1/11]: SELECT id, name FROM "User" LIMIT ${parentCount};` }
      ]);

      if (parentCount >= 10) {
        setAchievedStarvation(true);
      }

      setTimeout(() => {
        setLogs(p => [
          ...p,
          { id: (start + 2).toString(), type: 'error', text: `🔥 POOL SATURATION: 1 initial query + ${parentCount} sequential child queries dispatched!` },
          { id: (start + 3).toString(), type: 'error', text: `Total queries: ${1 + parentCount}. Thread pool blocked for ${estimatedLatencyMs}ms.` }
        ]);
        setActiveConnections(0);
        setIsExecuting(false);
      }, 700);
      return;
    }

    if (strategy === 'dataloader-batch') {
      setActiveConnections(1);
      setAchievedBatching(true);
      setLogs([
        { id: start.toString(), type: 'system', text: `Executing DataLoader: prisma.user.findMany({ include: { posts: true } })` },
        { id: (start + 1).toString(), type: 'output', text: `Query 1: SELECT id, name FROM "User" LIMIT ${parentCount};` },
        { id: (start + 2).toString(), type: 'success', text: `Query 2 (Batch Coalesce): SELECT * FROM "Post" WHERE "userId" IN (${Array.from({ length: parentCount }, (_, i) => i + 1).join(', ')});` }
      ]);

      setTimeout(() => {
        setLogs(p => [
          ...p,
          { id: (start + 3).toString(), type: 'success', text: `✓ Microtask coalesced ${parentCount} child fetches into 1 IN-predicate query. Total round trips: 2.` }
        ]);
        setActiveConnections(0);
        setIsExecuting(false);
      }, 400);
      return;
    }

    if (strategy === 'eager-join') {
      setActiveConnections(1);
      setLogs([
        { id: start.toString(), type: 'system', text: `Executing Raw SQL Single-Roundtrip Eager JOIN` },
        { id: (start + 1).toString(), type: 'success', text: `Query 1: SELECT u.id, u.name, p.id AS post_id, p.title FROM "User" u LEFT JOIN "Post" p ON p."userId" = u.id LIMIT ${parentCount * 4};` }
      ]);

      setTimeout(() => {
        setLogs(p => [
          ...p,
          { id: (start + 2).toString(), type: 'success', text: `✓ 1 single query roundtrip. Note: Duplicate parent fields transferred over wire for each joined child.` }
        ]);
        setActiveConnections(0);
        setIsExecuting(false);
      }, 400);
    }
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('orm-queries')) {
        list.push('orm-queries');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 05 (ORM Queries & N+1 Problem) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Production Connection Pool Exhaustion</span>
            <span className="badge badge-indigo">Module 05</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            The <strong>N+1 query trap</strong> occurs when an application fetches 1 collection of parent records,
            then issues an additional child database query inside an application-level loop for every parent.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            <strong>The Systems Impact:</strong> Each query incurs a network round trip (RTT ~ 2 to 10 ms).
            Concurrent web workers saturate the database connection pool, leading to connection timeouts (HTTP 504 / 500).
          </p>
        </div>

        {/* ORM Query Builder Controls */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Query Architecture Config</span>
            <span className={`badge ${strategy === 'naive-loop' ? 'badge-rose' : 'badge-emerald'}`}>
              {strategy === 'naive-loop' ? 'N+1 Vulnerable' : 'Batch Optimized'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Parent Records to Fetch (N = {parentCount}):</label>
              <input
                type="range"
                min={5}
                max={25}
                step={5}
                value={parentCount}
                onChange={(e) => setParentCount(parseInt(e.target.value, 10))}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Query Execution Strategy:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 6 }}>
                <button
                  className={`btn ${strategy === 'naive-loop' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setStrategy('naive-loop')}
                  style={{ fontSize: 11, padding: '8px 4px', justifyContent: 'center' }}
                >
                  Naive Loop (N+1)
                </button>
                <button
                  className={`btn ${strategy === 'dataloader-batch' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setStrategy('dataloader-batch')}
                  style={{ fontSize: 11, padding: '8px 4px', justifyContent: 'center' }}
                >
                  DataLoader (2 RTT)
                </button>
                <button
                  className={`btn ${strategy === 'eager-join' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStrategy('eager-join')}
                  style={{ fontSize: 11, padding: '8px 4px', justifyContent: 'center' }}
                >
                  Eager JOIN (1 RTT)
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={isExecuting}
              onClick={runSimulation}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {isExecuting ? 'Dispatching Queries...' : '▶ Execute Query Pipeline'}
            </button>
          </div>
        </div>

        {/* Database Connection Pool Monitor */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Database Connection Pool (Max: {poolSize})</span>
            <span style={{ color: poolSaturationPercent > 70 ? 'var(--rose)' : 'var(--emerald)', fontSize: 13, fontWeight: 700 }}>
              {poolSaturationPercent}% Saturated
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, margin: '10px 0 14px' }}>
            {Array.from({ length: poolSize }).map((_, idx) => {
              const isBusy = idx < activeConnections || (isExecuting && idx < (strategy === 'naive-loop' ? Math.min(poolSize, parentCount) : 1));
              return (
                <div
                  key={idx}
                  title={`Slot ${idx + 1}: ${isBusy ? 'In Use' : 'Idle'}`}
                  style={{
                    height: 24,
                    borderRadius: 4,
                    background: isBusy ? 'var(--rose)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isBusy ? 'var(--rose)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
            <div style={{ padding: '8px 10px', background: '#040711', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Dispatched Queries:</span>
              <strong style={{ display: 'block', fontSize: 16, color: queryCount > 5 ? 'var(--rose)' : 'var(--emerald)', marginTop: 2 }}>
                {queryCount} Queries
              </strong>
            </div>
            <div style={{ padding: '8px 10px', background: '#040711', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Latency:</span>
              <strong style={{ display: 'block', fontSize: 16, color: estimatedLatencyMs > 50 ? 'var(--rose)' : 'var(--emerald)', marginTop: 2 }}>
                {estimatedLatencyMs} ms
              </strong>
            </div>
          </div>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>ORM Performance Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedStarvation ? '✅' : '⏳'}</span>
              <span>Witness connection pool saturation under naive ORM loop ($N \ge 10$)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedBatching ? '✅' : '⏳'}</span>
              <span>Collapse $1 + N$ queries into exactly 2 queries using DataLoader batching</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedBatching ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedBatching}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 05 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="SQL Engine AST & Trace Buffer" />
      </div>

      {/* Right Column: Code Comparison & Network Waterfall */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Application Code vs Emitted Wire Queries</span>
            <span className="badge badge-indigo">SQL Wire Trace</span>
          </div>

          {/* Strategy Code snippet */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>TypeScript / Prisma Implementation:</span>
            <pre style={{
              background: '#040711',
              padding: '12px 14px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              color: 'var(--cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              marginTop: 4,
              overflowX: 'auto'
            }}>
{strategy === 'naive-loop' ? `// NAIVE ANTI-PATTERN: N+1 Loops
const users = await prisma.user.findMany({ take: ${parentCount} });
for (const user of users) {
  // 💥 Dispatches 1 individual SQL query per user!
  user.posts = await prisma.post.findMany({ where: { userId: user.id } });
}` : strategy === 'dataloader-batch' ? `// OPTIMIZED: DataLoader Microtask Batching
// Prisma internally batches relation queries via DataLoader pattern:
const users = await prisma.user.findMany({
  take: ${parentCount},
  include: { posts: true }
});` : `// SINGLE ROUNDTRIP: Raw SQL Eager JOIN
const result = await db.query(\`
  SELECT u.id, u.name, p.id AS post_id, p.title 
  FROM "User" u 
  LEFT JOIN "Post" p ON p."userId" = u.id 
  LIMIT ${parentCount * 3}
\`);`}
            </pre>
          </div>

          {/* Emitted SQL Queries */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Actual Emitted PostgreSQL Wire Queries:</span>
            <div style={{
              background: '#02040a',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              marginTop: 4,
              maxHeight: 180,
              overflowY: 'auto'
            }}>
              {strategy === 'naive-loop' ? (
                <>
                  <div style={{ color: 'var(--indigo)' }}>-- Query 1 (Initial fetch):</div>
                  <div style={{ color: '#fff', marginBottom: 8 }}>SELECT id, name FROM "User" LIMIT {parentCount};</div>
                  <div style={{ color: 'var(--rose)' }}>-- N = {parentCount} sequential queries executed in loop:</div>
                  {Array.from({ length: parentCount }).map((_, i) => (
                    <div key={i} style={{ color: 'rgba(255, 100, 100, 0.85)' }}>
                      SELECT * FROM "Post" WHERE "userId" = {i + 1};
                    </div>
                  ))}
                </>
              ) : strategy === 'dataloader-batch' ? (
                <>
                  <div style={{ color: 'var(--emerald)' }}>-- Query 1: Fetch parent collection (1 RTT)</div>
                  <div style={{ color: '#fff', marginBottom: 8 }}>SELECT id, name FROM "User" LIMIT {parentCount};</div>
                  <div style={{ color: 'var(--emerald)' }}>-- Query 2: Coalesced child batch query (1 RTT)</div>
                  <div style={{ color: '#fff' }}>
                    SELECT * FROM "Post" WHERE "userId" IN ({Array.from({ length: parentCount }, (_, i) => i + 1).join(', ')});
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: 'var(--cyan)' }}>-- Query 1: Single joined tabular projection (1 RTT)</div>
                  <div style={{ color: '#fff' }}>
                    SELECT u.id, u.name, p.id AS post_id, p.title FROM "User" u LEFT JOIN "Post" p ON p."userId" = u.id LIMIT {parentCount * 3};
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Network Round-Trip Waterfall */}
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Network Round-Trip Time (RTT) Waterfall:</span>
            <div style={{ background: '#040711', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px', marginTop: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {strategy === 'naive-loop' ? (
                  Array.from({ length: Math.min(8, 1 + parentCount) }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ width: 60, color: 'var(--text-dim)' }}>{i === 0 ? 'Parent' : `Child #${i}`}</span>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (i + 1) * 12)}%`, height: '100%', background: 'var(--rose)' }} />
                      </div>
                      <span style={{ width: 45, color: 'var(--rose)', textAlign: 'right' }}>5ms</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ width: 60, color: 'var(--text-dim)' }}>Query 1</span>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '40%', height: '100%', background: 'var(--emerald)' }} />
                      </div>
                      <span style={{ width: 45, color: 'var(--emerald)', textAlign: 'right' }}>4ms</span>
                    </div>
                    {strategy === 'dataloader-batch' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        <span style={{ width: 60, color: 'var(--text-dim)' }}>Query 2</span>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: '50%', height: '100%', background: 'var(--emerald)' }} />
                        </div>
                        <span style={{ width: 45, color: 'var(--emerald)', textAlign: 'right' }}>5ms</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
