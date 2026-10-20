import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const OrmQuerySimulator: React.FC = () => {
  const [includeRelations, setIncludeRelations] = useState<boolean>(false);
  const [batching, setBatching] = useState<boolean>(false);

  const logs: LogEntry[] = includeRelations
    ? batching 
      ? [
          { id: '1', type: 'system', text: 'prisma.user.findMany({ include: { posts: true } })' },
          { id: '2', type: 'output', text: 'OPTIMIZED: SELECT * FROM "User";' },
          { id: '3', type: 'success', text: 'DATALOADER BATCH: SELECT * FROM "Post" WHERE "userId" IN (1, 2, 3, 4, 5); (2 queries total)' }
        ]
      : [
          { id: '1', type: 'system', text: 'for (const u of users) { await prisma.post.findMany({ where: { userId: u.id } }) }' },
          { id: '2', type: 'error', text: 'CRITICAL N+1 BUG DETECTED: 1 initial query + 5 individual queries dispatched!' },
          { id: '3', type: 'error', text: 'Connection pool exhausted (5 connections saturated for 50ms).' }
        ]
    : [
        { id: '1', type: 'system', text: 'prisma.user.findMany()' },
        { id: '2', type: 'output', text: 'SELECT "id", "email", "name" FROM "User" LIMIT 50;' }
      ];

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 5</span>
          <span className="badge">Prisma / Drizzle AST Compiler</span>
        </div>
        <h2 className="sim-title">ORM Query Compilation & N+1 Problem</h2>
        <p className="sim-desc">
          ORMs provide type-safe query builders, but naive relationship fetching causes the notorious N+1 query trap. 
          Learn how DataLoader and JOIN compilation prevent database connection exhaustion.
        </p>
      </div>

      <div className="control-toolbar">
        <button className={`btn ${includeRelations ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIncludeRelations(!includeRelations)}>
          {includeRelations ? 'Relations: Included (posts)' : 'Include Relations'}
        </button>
        {includeRelations && (
          <button className={`btn ${batching ? 'btn-primary' : 'btn-danger'}`} onClick={() => setBatching(!batching)}>
            {batching ? 'DataLoader Batching: ON (Safe)' : 'DataLoader Batching: OFF (N+1 Bug)'}
          </button>
        )}
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">TypeScript ORM Method Call</div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-cyan)' }}>
{includeRelations 
  ? `const users = await prisma.user.findMany({\n  include: { posts: true }\n});`
  : `const users = await prisma.user.findMany();`}
          </pre>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">Compiled SQL Queries Executed</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: includeRelations && !batching ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            {includeRelations 
              ? batching ? '2 Batched Queries (Safe)' : '6 Queries (1 + N loop)'
              : '1 Query'}
          </div>
        </div>
      </div>

      <TerminalPane logs={logs} title="Postgres Connection Pool Trace" />
    </div>
  );
};
