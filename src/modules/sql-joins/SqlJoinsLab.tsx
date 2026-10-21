import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface SqlLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  targetJoinType: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';
  expectedRowCount: number;
}

const SQL_LEVELS: SqlLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Exact Match (INNER JOIN)',
    subtitle: 'Connecting Related Records',
    story: 'You want to display a list of all customers who have placed at least one order. Customers without orders should not be shown.',
    concept: 'INNER JOIN looks at both tables and keeps ONLY the rows where the linking key matches in BOTH tables (users.id = orders.user_id). If a user has no orders, they vanish from the output.',
    goalDescription: 'Select "INNER JOIN" and click "Execute Query" to return only the 3 users who have active orders.',
    hint: 'Choose INNER JOIN from the buttons and click Execute Query.',
    targetJoinType: 'INNER',
    expectedRowCount: 3
  },
  {
    id: 2,
    title: 'Level 2: The Inclusive List (LEFT JOIN)',
    subtitle: 'Never Losing Left-Side Records',
    story: 'Your sales manager needs a list of ALL registered users so they can email discounts to users who have NOT ordered yet. If you use INNER JOIN, those inactive users are erased!',
    concept: 'LEFT JOIN keeps EVERY row from the left table (users), even if there is no matching record in the right table (orders). The missing order fields are filled with NULL.',
    goalDescription: 'Select "LEFT JOIN" and click "Execute Query" to inspect how users without orders appear with NULL values.',
    hint: 'Choose LEFT JOIN and execute the query to preserve all 4 users.',
    targetJoinType: 'LEFT',
    expectedRowCount: 4
  },
  {
    id: 3,
    title: 'Level 3: Orphaned Data (RIGHT JOIN)',
    subtitle: 'Preserving All Right-Side Records',
    story: 'What if an order exists in your database that references a user account that was deleted? How do financial auditors find these orphaned orders?',
    concept: 'RIGHT JOIN keeps EVERY row from the right table (orders), even if the left table (users) has no corresponding match. If user_id is missing, the user columns become NULL.',
    goalDescription: 'Select "RIGHT JOIN" and execute the query to inspect all orders, including any orphaned transactions.',
    hint: 'Choose RIGHT JOIN and execute the query.',
    targetJoinType: 'RIGHT',
    expectedRowCount: 4
  },
  {
    id: 4,
    title: 'Level 4: The Combinatorial Explosion (CROSS JOIN)',
    subtitle: 'Cartesian Product of Every Row',
    story: 'You have 4 users and 4 orders. What happens if a junior developer forgets the ON condition in their SQL query?',
    concept: 'CROSS JOIN combines EVERY row of Table A with EVERY row of Table B (4 users × 4 orders = 16 rows). On large production tables with 100,000 rows, this accidental Cartesian product can crash database servers!',
    goalDescription: 'Select "CROSS JOIN" and execute the query to observe how 4 users and 4 orders balloon into 16 total rows.',
    hint: 'Select CROSS JOIN and click Execute Query to see all 16 combinations.',
    targetJoinType: 'CROSS',
    expectedRowCount: 16
  }
];

const USERS = [
  { id: 1, name: 'Alice', city: 'San Francisco' },
  { id: 2, name: 'Bob', city: 'Austin' },
  { id: 3, name: 'Charlie', city: 'New York' },
  { id: 4, name: 'Diana', city: 'Seattle' }
];

const ORDERS = [
  { id: 101, user_id: 1, total: '$45.00' },
  { id: 102, user_id: 1, total: '$89.00' },
  { id: 103, user_id: 2, total: '$120.00' },
  { id: 104, user_id: 99, total: '$35.00' }
];

export const SqlJoinsLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = SQL_LEVELS[levelIdx];

  const [selectedJoin, setSelectedJoin] = useState<'INNER' | 'LEFT' | 'RIGHT' | 'CROSS'>('INNER');
  const [results, setResults] = useState<any[]>([]);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon && hasExecuted && selectedJoin === currentLevel.targetJoinType) {
      setLevelWon(true);
      saveModuleCompletion();
    }
  }, [hasExecuted, selectedJoin, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('sql-joins')) {
        list.push('sql-joins');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    const l = SQL_LEVELS[idx];
    setSelectedJoin(l.targetJoinType);
    setResults([]);
    setHasExecuted(false);
    setShowHint(false);
    setLevelWon(false);
  };

  const executeJoin = () => {
    const rows: any[] = [];

    if (selectedJoin === 'INNER') {
      USERS.forEach(u => {
        const matches = ORDERS.filter(o => o.user_id === u.id);
        matches.forEach(o => {
          rows.push({ user_id: u.id, user_name: u.name, city: u.city, order_id: o.id, total: o.total });
        });
      });
    } else if (selectedJoin === 'LEFT') {
      USERS.forEach(u => {
        const matches = ORDERS.filter(o => o.user_id === u.id);
        if (matches.length > 0) {
          matches.forEach(o => {
            rows.push({ user_id: u.id, user_name: u.name, city: u.city, order_id: o.id, total: o.total });
          });
        } else {
          rows.push({ user_id: u.id, user_name: u.name, city: u.city, order_id: 'NULL', total: 'NULL' });
        }
      });
    } else if (selectedJoin === 'RIGHT') {
      ORDERS.forEach(o => {
        const u = USERS.find(user => user.id === o.user_id);
        if (u) {
          rows.push({ user_id: u.id, user_name: u.name, city: u.city, order_id: o.id, total: o.total });
        } else {
          rows.push({ user_id: 'NULL', user_name: 'NULL', city: 'NULL', order_id: o.id, total: o.total });
        }
      });
    } else if (selectedJoin === 'CROSS') {
      USERS.forEach(u => {
        ORDERS.forEach(o => {
          rows.push({ user_id: u.id, user_name: u.name, city: u.city, order_id: o.id, total: o.total });
        });
      });
    }

    setResults(rows);
    setHasExecuted(true);
  };

  const autoPlaySolution = () => {
    setSelectedJoin(currentLevel.targetJoinType);
    setTimeout(() => {
      executeJoin();
    }, 300);
  };

  return (
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Visual Joined Results & Companion Query Controls */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live Tables & Joined Result Grid */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  SQL Join Relational Inspector
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  SELECT * FROM users {selectedJoin} JOIN orders ON users.id = orders.user_id
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge badge-indigo">{selectedJoin} JOIN</span>
                <span className="badge">{results.length} Rows</span>
              </div>
            </div>

            {/* Source Tables Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8, fontSize: 11.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>users (Left Table)</span>
                  <span className="badge" style={{ fontSize: 9.5 }}>{USERS.length} rows</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {USERS.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontWeight: 600 }}>#{u.id} {u.name}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{u.city}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8, fontSize: 11.5 }}>
                <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>orders (Right Table)</span>
                  <span className="badge badge-success" style={{ fontSize: 9.5 }}>{ORDERS.length} rows</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ORDERS.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span>#{o.id} (user_id: {o.user_id})</span>
                      <span style={{ color: 'var(--text-dim)' }}>{o.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SQL Results Table */}
            <div style={{ flex: 1, border: '1.5px solid var(--border-light)', borderRadius: 10, overflow: 'auto', background: '#ffffff', minHeight: 140 }}>
              {results.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                  Click "Execute Query" on the right to inspect joined result set.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '6px 10px' }}>user_id</th>
                      <th style={{ padding: '6px 10px' }}>user_name</th>
                      <th style={{ padding: '6px 10px' }}>city</th>
                      <th style={{ padding: '6px 10px' }}>order_id</th>
                      <th style={{ padding: '6px 10px' }}>total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => {
                      const hasNull = row.order_id === 'NULL' || row.user_id === 'NULL';
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border-light)',
                            background: hasNull ? '#fffbeb' : '#ffffff'
                          }}
                        >
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>{row.user_id}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.user_name}</td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{row.city}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: row.order_id === 'NULL' ? '#d97706' : 'var(--text-main)', fontWeight: row.order_id === 'NULL' ? 700 : 400 }}>
                            {row.order_id}
                          </td>
                          <td style={{ padding: '6px 10px', color: row.total === 'NULL' ? '#d97706' : 'var(--success)', fontWeight: 600 }}>
                            {row.total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact SQL Terminal & Join Controls */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {SQL_LEVELS.map((lvl, idx) => (
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

              {/* Join Selector */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Select Join Type:
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(['INNER', 'LEFT', 'RIGHT', 'CROSS'] as const).map(type => (
                    <button
                      key={type}
                      className={`btn btn-sm ${selectedJoin === type ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedJoin(type)}
                      style={{ padding: '3px 8px', fontSize: 11 }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={executeJoin} style={{ fontSize: 11, padding: '4px 10px' }}>
                  Execute Query
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

            {/* Compact Authentic macOS SQL Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  POSTGRESQL QUERY PLANNER — psql
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {!hasExecuted ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    psql=# Select join type and click "Execute Query".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="terminal-line" style={{ color: '#38bdf8' }}>
                      <span className="glyph">→</span>
                      <span>EXPLAIN ANALYZE SELECT * FROM users {selectedJoin} JOIN orders;</span>
                    </div>
                    <div className="terminal-line" style={{ color: '#cbd5e1' }}>
                      <span className="glyph">•</span>
                      <span>Execution plan: {selectedJoin === 'CROSS' ? 'Nested Loop Cartesian Product' : 'Hash Join on users.id = orders.user_id'}</span>
                    </div>
                    <div className="terminal-line" style={{ color: '#4ade80' }}>
                      <span className="glyph">✓</span>
                      <span>Returned {results.length} row(s) in 0.14 ms</span>
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
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered {selectedJoin} JOIN row preservation.</div>
                </div>
                {levelIdx < SQL_LEVELS.length - 1 ? (
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
        {/* Left Card: SQL Relational Algebra Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            Relational Database Theory
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            Relational Algebra &amp; Join Mechanics
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>RDBMS Join Matrix:</div>
            <div>• INNER: Intersection only (A ∩ B)</div>
            <div>• LEFT:  All left rows + matched right rows (NULL if missing)</div>
            <div>• RIGHT: All right rows + matched left rows (NULL if missing)</div>
            <div>• CROSS: Cartesian product (rows_A × rows_B)</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The Accidental Cartesian Product
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> Omitting the `ON` condition or accidentally writing `CROSS JOIN` between two tables of 100,000 rows generates 10,000,000,000 intermediate rows, instantly exhausting PostgreSQL memory (`work_mem`) and locking table buffer pools.
          </div>
        </div>
      </div>
    </div>
  );
};
