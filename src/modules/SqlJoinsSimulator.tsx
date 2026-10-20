import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const SqlJoinsSimulator: React.FC = () => {
  const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'RIGHT' | 'FULL'>('INNER');

  const users = [
    { id: 1, name: 'Alice', dept_id: 10 },
    { id: 2, name: 'Bob', dept_id: 20 },
    { id: 3, name: 'Charlie', dept_id: null },
  ];

  const depts = [
    { id: 10, name: 'Engineering' },
    { id: 20, name: 'Product' },
    { id: 30, name: 'Marketing' },
  ];

  let joinedRows: any[] = [];
  if (joinType === 'INNER') {
    joinedRows = [
      { id: 1, user: 'Alice', dept: 'Engineering' },
      { id: 2, user: 'Bob', dept: 'Product' },
    ];
  } else if (joinType === 'LEFT') {
    joinedRows = [
      { id: 1, user: 'Alice', dept: 'Engineering' },
      { id: 2, user: 'Bob', dept: 'Product' },
      { id: 3, user: 'Charlie', dept: 'NULL' },
    ];
  } else if (joinType === 'RIGHT') {
    joinedRows = [
      { id: 1, user: 'Alice', dept: 'Engineering' },
      { id: 2, user: 'Bob', dept: 'Product' },
      { id: null, user: 'NULL', dept: 'Marketing' },
    ];
  } else {
    joinedRows = [
      { id: 1, user: 'Alice', dept: 'Engineering' },
      { id: 2, user: 'Bob', dept: 'Product' },
      { id: 3, user: 'Charlie', dept: 'NULL' },
      { id: null, user: 'NULL', dept: 'Marketing' },
    ];
  }

  const logs: LogEntry[] = [
    { id: '1', type: 'system', text: `SELECT users.name, depts.name FROM users ${joinType} JOIN depts ON users.dept_id = depts.id;` },
    { id: '2', type: 'success', text: `Returned ${joinedRows.length} matching rows in 1.2ms (B-Tree index hit).` }
  ];

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 4</span>
          <span className="badge">PostgreSQL / Relational Algebra</span>
        </div>
        <h2 className="sim-title">SQL Relational Joins & Venn Intersections</h2>
        <p className="sim-desc">
          Visualize relational table joins. Watch how foreign keys intersect and how NULL rows are padded in outer joins.
        </p>
      </div>

      <div className="control-toolbar">
        {(['INNER', 'LEFT', 'RIGHT', 'FULL'] as const).map(t => (
          <button 
            key={t}
            className={`btn ${joinType === t ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setJoinType(t)}
          >
            {t} JOIN
          </button>
        ))}
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">Left Table: users</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {users.map(u => (
              <div key={u.id} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {u.id} | {u.name} (dept_id: {u.dept_id ?? 'NULL'})
              </div>
            ))}
          </div>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">Right Table: depts</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {depts.map(d => (
              <div key={d.id} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {d.id} | {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="vis-card" style={{ gridColumn: 'span 2' }}>
          <div className="vis-card-title" style={{ color: 'var(--accent-emerald)' }}>
            Resulting Join Set: {joinType} JOIN ({joinedRows.length} rows)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {joinedRows.map((r, i) => (
              <div key={i} style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.08)', marginBottom: 4, borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>User: <strong>{r.user}</strong></span>
                <span>Dept: <strong>{r.dept}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TerminalPane logs={logs} title="PostgreSQL Query Execution Plan (EXPLAIN ANALYZE)" />
    </div>
  );
};
