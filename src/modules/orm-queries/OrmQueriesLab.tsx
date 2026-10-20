import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const OrmQueriesLab: React.FC = () => {
  const [useDataLoader, setUseDataLoader] = useState<boolean>(true);
  const [includePosts, setIncludePosts] = useState<boolean>(true);

  const queryCount = includePosts ? (useDataLoader ? 2 : 6) : 1;
  const poolSaturation = includePosts ? (useDataLoader ? 20 : 90) : 10;

  const logs: LogEntry[] = useDataLoader
    ? [
        { id: '1', type: 'system', text: 'prisma.user.findMany({ include: { posts: true } })' },
        { id: '2', type: 'output', text: 'Query 1: SELECT "id", "name" FROM "User" LIMIT 5;' },
        { id: '3', type: 'success', text: 'DataLoader Batch: SELECT * FROM "Post" WHERE "userId" IN (1, 2, 3, 4, 5);' },
        { id: '4', type: 'success', text: 'Optimized into 2 queries total. Pool latency: 1.8ms.' }
      ]
    : [
        { id: '1', type: 'system', text: 'for (const user of users) { await prisma.post.findMany({ where: { userId: user.id } }) }' },
        { id: '2', type: 'error', text: 'N+1 PERFORMANCE TRAP: 1 initial query + 5 individual queries dispatched in a loop!' },
        { id: '3', type: 'error', text: 'CRITICAL: Connection pool exhausted (90% saturation). High latency spike.' }
      ];

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">ORM Query Builder Config</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={includePosts} 
                onChange={(e) => setIncludePosts(e.target.checked)} 
              />
              <span>Include Relations: <code>posts</code> (One-to-Many)</span>
            </label>

            {includePosts && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={useDataLoader} 
                  onChange={(e) => setUseDataLoader(e.target.checked)} 
                />
                <span style={{ color: useDataLoader ? 'var(--emerald)' : 'var(--rose)' }}>
                  Enable DataLoader Batching (Prevent N+1)
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Database Pool Monitor</div>
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>Connection Pool Saturation</span>
            <span style={{ color: poolSaturation > 50 ? 'var(--rose)' : 'var(--emerald)' }}>{poolSaturation}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#0a0e1c', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${poolSaturation}%`, height: '100%', background: poolSaturation > 50 ? 'var(--rose)' : 'var(--emerald)', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Total queries dispatched: <strong>{queryCount}</strong>
          </p>
        </div>

        <TerminalPane logs={logs} title="SQL Dialect AST Compiler" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Compiled SQL Output</span>
            <span className={`badge ${useDataLoader ? 'badge-emerald' : 'badge-amber'}`}>
              {useDataLoader ? 'Optimized' : 'N+1 Vulnerable'}
            </span>
          </div>

          <div className="code-preview-box" style={{ flex: 1 }}>
            {useDataLoader ? (
              <>
                <span style={{ color: 'var(--text-dim)' }}>-- Step 1: Fetch users</span><br/>
                SELECT "id", "name" FROM "User" LIMIT 5;<br/><br/>
                <span style={{ color: 'var(--text-dim)' }}>-- Step 2: Batch fetch related posts via IN clause</span><br/>
                SELECT "id", "title", "userId" FROM "Post"<br/>
                WHERE "userId" IN (1, 2, 3, 4, 5);
              </>
            ) : (
              <>
                <span style={{ color: 'var(--rose)' }}>-- Query 1 (Initial fetch)</span><br/>
                SELECT "id", "name" FROM "User" LIMIT 5;<br/><br/>
                <span style={{ color: 'var(--rose)' }}>-- N Queries executed sequentially in loop:</span><br/>
                SELECT * FROM "Post" WHERE "userId" = 1;<br/>
                SELECT * FROM "Post" WHERE "userId" = 2;<br/>
                SELECT * FROM "Post" WHERE "userId" = 3;<br/>
                SELECT * FROM "Post" WHERE "userId" = 4;<br/>
                SELECT * FROM "Post" WHERE "userId" = 5;
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
