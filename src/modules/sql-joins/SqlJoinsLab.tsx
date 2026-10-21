import React, { useState, useEffect } from 'react';

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
    title: 'Level 1: Finding Common Data (INNER JOIN)',
    subtitle: 'Matching Foreign Keys',
    story: 'You have a list of registered users and a list of shopping orders. How do you find only the users who have actually bought something?',
    concept: 'INNER JOIN keeps only rows where the join condition matches on BOTH sides (users.id = orders.user_id). If a user has 0 orders, they are filtered out.',
    goalDescription: 'Select INNER JOIN and click "Execute Query" to return only users who have active orders.',
    hint: 'Click the "INNER JOIN" option and run the query.',
    targetJoinType: 'INNER',
    expectedRowCount: 3
  },
  {
    id: 2,
    title: 'Level 2: Keeping Everyone (LEFT JOIN & NULLs)',
    subtitle: 'Preserving Left Table Records',
    story: 'Your sales team wants a list of ALL users—including users who never made a purchase—so they can email them a first-order discount coupon.',
    concept: 'LEFT JOIN keeps every single row from the left table (users). When a user has 0 orders, SQL fills the missing order columns with NULL.',
    goalDescription: 'Select LEFT JOIN and observe David (who has 0 orders) appear with NULL for order fields.',
    hint: 'Select "LEFT JOIN" and click "Execute Query".',
    targetJoinType: 'LEFT',
    expectedRowCount: 4
  },
  {
    id: 3,
    title: 'Level 3: Preserving the Right Side (RIGHT JOIN)',
    subtitle: 'Handling Orphaned or Guest Orders',
    story: 'What if someone checked out as a guest without creating an account? The order exists in the orders table, but there is no matching user.',
    concept: 'RIGHT JOIN keeps every row from the right table (orders). If an order has no matching user, SQL fills the user columns with NULL.',
    goalDescription: 'Select RIGHT JOIN and observe the guest order (#104) appear with NULL user details.',
    hint: 'Select "RIGHT JOIN" and run the query.',
    targetJoinType: 'RIGHT',
    expectedRowCount: 4
  },
  {
    id: 4,
    title: 'Level 4: The Accidental Explosion (CROSS JOIN)',
    subtitle: 'What Happens When You Forget the ON Condition',
    story: 'What happens if a developer writes `SELECT * FROM users, orders` without specifying how the two tables connect?',
    concept: 'Without a join condition, SQL combines every row in Table A with every single row in Table B (4 users × 4 orders = 16 rows!). In production, a CROSS JOIN on large tables can crash database memory.',
    goalDescription: 'Select CROSS JOIN to see how missing join conditions cause row counts to explode.',
    hint: 'Select "CROSS JOIN" and click "Execute Query".',
    targetJoinType: 'CROSS',
    expectedRowCount: 16
  }
];

const USERS = [
  { id: 1, name: 'Alice', city: 'Seattle' },
  { id: 2, name: 'Bob', city: 'Austin' },
  { id: 3, name: 'Charlie', city: 'Boston' },
  { id: 4, name: 'David', city: 'Denver' } // 0 orders
];

const ORDERS = [
  { id: 101, user_id: 1, total: '$45.00' },
  { id: 102, user_id: 2, total: '$120.00' },
  { id: 103, user_id: 1, total: '$18.50' },
  { id: 104, user_id: 99, total: '$85.00' } // Guest / Orphan
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
    let rows: any[] = [];

    if (selectedJoin === 'INNER') {
      USERS.forEach(u => {
        const userOrders = ORDERS.filter(o => o.user_id === u.id);
        userOrders.forEach(o => {
          rows.push({
            user_id: u.id,
            user_name: u.name,
            city: u.city,
            order_id: o.id,
            total: o.total
          });
        });
      });
    } else if (selectedJoin === 'LEFT') {
      USERS.forEach(u => {
        const userOrders = ORDERS.filter(o => o.user_id === u.id);
        if (userOrders.length === 0) {
          rows.push({
            user_id: u.id,
            user_name: u.name,
            city: u.city,
            order_id: 'NULL',
            total: 'NULL'
          });
        } else {
          userOrders.forEach(o => {
            rows.push({
              user_id: u.id,
              user_name: u.name,
              city: u.city,
              order_id: o.id,
              total: o.total
            });
          });
        }
      });
    } else if (selectedJoin === 'RIGHT') {
      ORDERS.forEach(o => {
        const u = USERS.find(user => user.id === o.user_id);
        rows.push({
          user_id: u ? u.id : 'NULL',
          user_name: u ? u.name : 'NULL',
          city: u ? u.city : 'NULL',
          order_id: o.id,
          total: o.total
        });
      });
    } else if (selectedJoin === 'CROSS') {
      USERS.forEach(u => {
        ORDERS.forEach(o => {
          rows.push({
            user_id: u.id,
            user_name: u.name,
            city: u.city,
            order_id: o.id,
            total: o.total
          });
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
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SQL_LEVELS.map((lvl, idx) => (
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

          {/* Join Selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Select Join Operation:
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['INNER', 'LEFT', 'RIGHT', 'CROSS'] as const).map(type => (
                <button
                  key={type}
                  className={`btn btn-sm ${selectedJoin === type ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedJoin(type)}
                >
                  {type} JOIN
                </button>
              ))}
            </div>
          </div>

          <div className="lesson-actions">
            <button className="btn btn-primary btn-sm" onClick={executeJoin}>
              Execute Query →
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered how this SQL join connects rows.</div>
            </div>
            {levelIdx < SQL_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}

        {/* Source Tables Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 6, padding: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>users (Left Table)</div>
            {USERS.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>{u.id}. {u.name}</span>
                <span style={{ color: 'var(--text-dim)' }}>{u.city}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 6, padding: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>orders (Right Table)</div>
            {ORDERS.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>#{o.id} (user {o.user_id})</span>
                <span style={{ color: 'var(--text-dim)' }}>{o.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Query Result Visualizer */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">
              Query Result: SELECT * FROM users {selectedJoin} JOIN orders
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Total Rows Returned: {results.length}
            </div>
          </div>
          <div>
            <span className="badge badge-indigo">{selectedJoin} JOIN</span>
          </div>
        </div>

        {/* SQL Results Table */}
        <div style={{ flex: 1, border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'auto', background: '#ffffff' }}>
          {results.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
              Click "Execute Query" to inspect the joined result set.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 12px' }}>user_id</th>
                  <th style={{ padding: '8px 12px' }}>user_name</th>
                  <th style={{ padding: '8px 12px' }}>city</th>
                  <th style={{ padding: '8px 12px' }}>order_id</th>
                  <th style={{ padding: '8px 12px' }}>total</th>
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
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{row.user_id}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.user_name}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{row.city}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: row.order_id === 'NULL' ? '#d97706' : 'var(--text-main)', fontWeight: row.order_id === 'NULL' ? 700 : 400 }}>
                        {row.order_id}
                      </td>
                      <td style={{ padding: '8px 12px', color: row.total === 'NULL' ? '#d97706' : 'var(--success)', fontWeight: 600 }}>
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
    </div>
  );
};
