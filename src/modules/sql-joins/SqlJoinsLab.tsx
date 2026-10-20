import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const SqlJoinsLab: React.FC = () => {
  const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'RIGHT' | 'FULL'>('INNER');

  const employees = [
    { id: 101, name: 'Alice Chen', dept_id: 1, salary: '$140k' },
    { id: 102, name: 'Bob Smith', dept_id: 2, salary: '$120k' },
    { id: 103, name: 'Charlie Kim', dept_id: null, salary: '$95k' },
    { id: 104, name: 'Dana Scott', dept_id: 1, salary: '$160k' }
  ];

  const departments = [
    { id: 1, dept_name: 'Core Systems', location: 'San Francisco' },
    { id: 2, dept_name: 'Platform Infra', location: 'New York' },
    { id: 3, dept_name: 'Developer Relations', location: 'London' }
  ];

  let resultRows: any[] = [];
  if (joinType === 'INNER') {
    resultRows = [
      { emp: 'Alice Chen', dept: 'Core Systems', salary: '$140k', loc: 'San Francisco' },
      { emp: 'Bob Smith', dept: 'Platform Infra', salary: '$120k', loc: 'New York' },
      { emp: 'Dana Scott', dept: 'Core Systems', salary: '$160k', loc: 'San Francisco' }
    ];
  } else if (joinType === 'LEFT') {
    resultRows = [
      { emp: 'Alice Chen', dept: 'Core Systems', salary: '$140k', loc: 'San Francisco' },
      { emp: 'Bob Smith', dept: 'Platform Infra', salary: '$120k', loc: 'New York' },
      { emp: 'Charlie Kim', dept: 'NULL', salary: '$95k', loc: 'NULL' },
      { emp: 'Dana Scott', dept: 'Core Systems', salary: '$160k', loc: 'San Francisco' }
    ];
  } else if (joinType === 'RIGHT') {
    resultRows = [
      { emp: 'Alice Chen', dept: 'Core Systems', salary: '$140k', loc: 'San Francisco' },
      { emp: 'Bob Smith', dept: 'Platform Infra', salary: '$120k', loc: 'New York' },
      { emp: 'Dana Scott', dept: 'Core Systems', salary: '$160k', loc: 'San Francisco' },
      { emp: 'NULL', dept: 'Developer Relations', salary: 'NULL', loc: 'London' }
    ];
  } else {
    resultRows = [
      { emp: 'Alice Chen', dept: 'Core Systems', salary: '$140k', loc: 'San Francisco' },
      { emp: 'Bob Smith', dept: 'Platform Infra', salary: '$120k', loc: 'New York' },
      { emp: 'Charlie Kim', dept: 'NULL', salary: '$95k', loc: 'NULL' },
      { emp: 'Dana Scott', dept: 'Core Systems', salary: '$160k', loc: 'San Francisco' },
      { emp: 'NULL', dept: 'Developer Relations', salary: 'NULL', loc: 'London' }
    ];
  }

  const logs: LogEntry[] = [
    { id: '1', type: 'system', text: `EXPLAIN ANALYZE SELECT e.name, d.dept_name FROM employees e ${joinType} JOIN departments d ON e.dept_id = d.id;` },
    { id: '2', type: 'success', text: `Hash Join (cost=1.04..2.15 rows=${resultRows.length} width=64) - Execution time: 0.18ms` }
  ];

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">Join Type Selector</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {(['INNER', 'LEFT', 'RIGHT', 'FULL'] as const).map(t => (
              <button
                key={t}
                className={`btn ${joinType === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setJoinType(t)}
                style={{ justifyContent: 'center' }}
              >
                {t} JOIN
              </button>
            ))}
          </div>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Compiled SQL Query</div>
          <div className="code-preview-box">
            SELECT e.name, d.dept_name, e.salary, d.location<br/>
            FROM employees e<br/>
            <strong style={{ color: 'var(--indigo)' }}>{joinType} JOIN</strong> departments d<br/>
            &nbsp;&nbsp;ON e.dept_id = d.id;
          </div>
        </div>

        <TerminalPane logs={logs} title="PostgreSQL Query Engine" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Result Set Table ({resultRows.length} rows returned)</span>
            <span className="badge badge-indigo">{joinType} Join Set</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0a0e1c', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Employee</th>
                  <th style={{ padding: '10px 14px' }}>Department</th>
                  <th style={{ padding: '10px 14px' }}>Salary</th>
                  <th style={{ padding: '10px 14px' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {resultRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: r.dept === 'NULL' || r.emp === 'NULL' ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: r.emp === 'NULL' ? 'var(--amber)' : '#fff' }}>{r.emp}</td>
                    <td style={{ padding: '10px 14px', color: r.dept === 'NULL' ? 'var(--amber)' : 'var(--cyan)' }}>{r.dept}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{r.salary}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{r.loc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
