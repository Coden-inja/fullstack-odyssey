import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
type PlanAlgorithm = 'Hash Join' | 'Nested Loop' | 'Merge Join';

interface Employee {
  id: number;
  name: string;
  dept_id: number | null;
  salary: number;
}

interface Department {
  id: number;
  dept_name: string;
  location: string;
}

const EMPLOYEES: Employee[] = [
  { id: 101, name: 'Alice Chen', dept_id: 1, salary: 145000 },
  { id: 102, name: 'Bob Smith', dept_id: 2, salary: 125000 },
  { id: 103, name: 'Charlie Kim', dept_id: null, salary: 98000 },
  { id: 104, name: 'Dana Scott', dept_id: 1, salary: 165000 },
  { id: 105, name: 'Elena Rostova', dept_id: 4, salary: 130000 } // dept 4 doesn't exist in departments table
];

const DEPARTMENTS: Department[] = [
  { id: 1, dept_name: 'Core Infrastructure', location: 'San Francisco' },
  { id: 2, dept_name: 'Distributed Systems', location: 'New York' },
  { id: 3, dept_name: 'Security Operations', location: 'Zurich' } // No employees in dept 3
];

export const SqlJoinsLab: React.FC = () => {
  const [joinType, setJoinType] = useState<JoinType>('INNER');
  const [algorithm, setAlgorithm] = useState<PlanAlgorithm>('Hash Join');
  const [filterNullsOnly, setFilterNullsOnly] = useState<boolean>(false);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenge tracking
  const [achievedOrphans, setAchievedOrphans] = useState<boolean>(false);
  const [achievedEmptyDept, setAchievedEmptyDept] = useState<boolean>(false);
  const [achievedPlanExplored, setAchievedPlanExplored] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'PostgreSQL 16.2 query optimizer and cost planner loaded.' },
    { id: '2', type: 'output', text: 'Select join strategy and inspect relational algebra projection.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('sql-joins')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  // Compute relational join
  const computeJoinRows = () => {
    const rows: {
      empId: number | null;
      empName: string | null;
      deptId: number | null;
      deptName: string | null;
      salary: number | null;
      location: string | null;
      isMatched: boolean;
    }[] = [];

    if (joinType === 'CROSS') {
      for (const e of EMPLOYEES) {
        for (const d of DEPARTMENTS) {
          rows.push({
            empId: e.id,
            empName: e.name,
            deptId: d.id,
            deptName: d.dept_name,
            salary: e.salary,
            location: d.location,
            isMatched: e.dept_id === d.id
          });
        }
      }
      return rows;
    }

    const matchedEmpIds = new Set<number>();
    const matchedDeptIds = new Set<number>();

    // 1. Process matches and Left side
    for (const e of EMPLOYEES) {
      const d = DEPARTMENTS.find(dept => dept.id === e.dept_id);
      if (d) {
        matchedEmpIds.add(e.id);
        matchedDeptIds.add(d.id);
        rows.push({
          empId: e.id,
          empName: e.name,
          deptId: d.id,
          deptName: d.dept_name,
          salary: e.salary,
          location: d.location,
          isMatched: true
        });
      } else if (joinType === 'LEFT' || joinType === 'FULL') {
        rows.push({
          empId: e.id,
          empName: e.name,
          deptId: null,
          deptName: null,
          salary: e.salary,
          location: null,
          isMatched: false
        });
      }
    }

    // 2. Process Right side unmatched
    if (joinType === 'RIGHT' || joinType === 'FULL') {
      for (const d of DEPARTMENTS) {
        if (!matchedDeptIds.has(d.id)) {
          rows.push({
            empId: null,
            empName: null,
            deptId: d.id,
            deptName: d.dept_name,
            salary: null,
            location: d.location,
            isMatched: false
          });
        }
      }
    }

    // Apply Filter Predicates
    return rows.filter(r => {
      if (filterNullsOnly) {
        if (r.deptName !== null && r.empName !== null) return false;
      }
      if (minSalary > 0 && r.salary !== null && r.salary < minSalary) return false;
      return true;
    });
  };

  const currentRows = computeJoinRows();

  // Explain analyze cost models
  const getExplainPlan = () => {
    switch (algorithm) {
      case 'Hash Join':
        return [
          `Hash ${joinType} Join (cost=1.04..4.22 rows=${currentRows.length} width=72)`,
          `  Hash Cond: (e.dept_id = d.id)`,
          `  -> Seq Scan on employees e (cost=0.00..2.05 rows=5 width=40)`,
          `  -> Hash (cost=1.03..1.03 rows=3 width=36)`,
          `        Buckets: 1024  Batches: 1  Memory Usage: 9kB`,
          `        -> Seq Scan on departments d (cost=0.00..1.03 rows=3 width=36)`,
          `Planning Time: 0.084 ms  Execution Time: 0.142 ms`
        ];
      case 'Nested Loop':
        return [
          `Nested Loop ${joinType} (cost=0.15..6.85 rows=${currentRows.length} width=72)`,
          `  -> Seq Scan on employees e (cost=0.00..2.05 rows=5 width=40)`,
          `  -> Index Scan using departments_pkey on departments d (cost=0.15..0.95 rows=1 width=36)`,
          `        Index Cond: (id = e.dept_id)`,
          `Planning Time: 0.112 ms  Execution Time: 0.098 ms`
        ];
      case 'Merge Join':
        return [
          `Merge ${joinType} Join (cost=3.45..5.12 rows=${currentRows.length} width=72)`,
          `  Merge Cond: (e.dept_id = d.id)`,
          `  -> Sort on employees e (cost=2.15..2.16 rows=5 width=40) Sort Key: e.dept_id`,
          `  -> Sort on departments d (cost=1.05..1.06 rows=3 width=36) Sort Key: d.id`,
          `Planning Time: 0.145 ms  Execution Time: 0.176 ms`
        ];
    }
  };

  const handleJoinChange = (t: JoinType) => {
    setJoinType(t);
    const plan = getExplainPlan();
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'system', text: `SET enable_hashjoin = ${algorithm === 'Hash Join'}; EXPLAIN ANALYZE SELECT ... ${t} JOIN ...` },
      { id: (Date.now() + 1).toString(), type: 'success', text: plan[0] }
    ]);

    if (t === 'LEFT' && filterNullsOnly) setAchievedOrphans(true);
    if (t === 'RIGHT' && filterNullsOnly) setAchievedEmptyDept(true);
  };

  const handleAlgorithmChange = (algo: PlanAlgorithm) => {
    setAlgorithm(algo);
    setAchievedPlanExplored(true);
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'system', text: `Optimizer switched planner join operator to: ${algo}` }
    ]);
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('sql-joins')) {
        list.push('sql-joins');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 04 (SQL Relational Joins) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Unmatched Foreign Keys</span>
            <span className="badge badge-indigo">Module 04</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            In relational algebra, joins project Cartesian products through filter predicates.
            NULL values break binary logic into <strong>Three-Valued Logic (3VL: TRUE, FALSE, UNKNOWN)</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 10, fontSize: 12 }}>
            <div style={{ background: '#040711', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--indigo)' }}>INNER:</span> Matches only
            </div>
            <div style={{ background: '#040711', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--emerald)' }}>LEFT:</span> All Left + NULL Right
            </div>
            <div style={{ background: '#040711', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--cyan)' }}>RIGHT:</span> All Right + NULL Left
            </div>
            <div style={{ background: '#040711', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--amber)' }}>FULL:</span> Union with NULLs
            </div>
          </div>
        </div>

        {/* Join Strategy & Algorithm Controls */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Relational Operator Selector</span>
            <span className="badge badge-indigo">{joinType} JOIN</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
            {(['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'] as JoinType[]).map(t => (
              <button
                key={t}
                className={`btn ${joinType === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleJoinChange(t)}
                style={{ fontSize: 11, padding: '8px 10px', justifyContent: 'center' }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Execution Plan Algorithm */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>PostgreSQL Execution Plan Operator:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
              {(['Hash Join', 'Nested Loop', 'Merge Join'] as PlanAlgorithm[]).map(algo => (
                <button
                  key={algo}
                  className={`btn ${algorithm === algo ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => handleAlgorithmChange(algo)}
                  style={{ fontSize: 10, padding: '6px 8px', justifyContent: 'center' }}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          {/* Predicate Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterNullsOnly}
                onChange={(e) => {
                  setFilterNullsOnly(e.target.checked);
                  if (joinType === 'LEFT' && e.target.checked) setAchievedOrphans(true);
                  if (joinType === 'RIGHT' && e.target.checked) setAchievedEmptyDept(true);
                }}
              />
              <span>Filter for Unmatched Rows Only (WHERE IS NULL)</span>
            </label>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min Salary Filter (WHERE e.salary &gt;= {minSalary ? `$${minSalary.toLocaleString()}` : '$0'}):</label>
              <input
                type="range"
                min={0}
                max={150000}
                step={25000}
                value={minSalary}
                onChange={(e) => setMinSalary(parseInt(e.target.value, 10))}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
          </div>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>SQL Relational Challenge Targets</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{joinType === 'LEFT' ? '✅' : '⏳'}</span>
              <span>Execute LEFT JOIN to preserve employees without valid departments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{joinType === 'RIGHT' ? '✅' : '⏳'}</span>
              <span>Execute RIGHT JOIN to audit departments without active personnel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedPlanExplored ? '✅' : '⏳'}</span>
              <span>Audit Hash Join vs Nested Loop vs Merge Join cost profile</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : joinType === 'LEFT' || joinType === 'RIGHT' ? 'btn-primary' : 'btn-secondary'}`}
            disabled={joinType !== 'LEFT' && joinType !== 'RIGHT'}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 04 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="PostgreSQL Execution Plan Traces" />
      </div>

      {/* Right Column: Compiled SQL, EXPLAIN ANALYZE tree, and Result Grid */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Compiled Query & PostgreSQL EXPLAIN Tree</span>
            <span className="badge badge-emerald">{currentRows.length} Rows Emitted</span>
          </div>

          {/* Compiled SQL Query preview */}
          <pre style={{
            background: '#040711',
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle)',
            color: 'var(--indigo)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            marginBottom: 12
          }}>
{`SELECT e.id, e.name, d.dept_name, e.salary, d.location
FROM employees e
${joinType} JOIN departments d ON e.dept_id = d.id${filterNullsOnly ? '\nWHERE (d.id IS NULL OR e.id IS NULL)' : ''}${minSalary > 0 ? `\nWHERE e.salary >= ${minSalary}` : ''};`}
          </pre>

          {/* EXPLAIN ANALYZE node tree */}
          <div style={{ background: '#02040a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600 }}>EXPLAIN (ANALYZE, BUFFERS, TIMING):</span>
            <pre style={{ margin: '6px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a5b4fc', lineHeight: 1.5 }}>
              {getExplainPlan().join('\n')}
            </pre>
          </div>

          {/* Projected Result Set Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#080c18', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Emp ID</th>
                  <th style={{ padding: '8px 12px' }}>Employee</th>
                  <th style={{ padding: '8px 12px' }}>Dept ID</th>
                  <th style={{ padding: '8px 12px' }}>Department</th>
                  <th style={{ padding: '8px 12px' }}>Salary</th>
                  <th style={{ padding: '8px 12px' }}>Location</th>
                  <th style={{ padding: '8px 12px' }}>Match Status</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((r, i) => {
                  const isNullPadded = r.empName === null || r.deptName === null;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isNullPadded ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: r.empId ? '#fff' : 'var(--amber)' }}>{r.empId ?? 'NULL'}</td>
                      <td style={{ padding: '8px 12px', color: r.empName ? '#fff' : 'var(--amber)', fontWeight: r.empName ? 600 : 400 }}>{r.empName ?? 'NULL'}</td>
                      <td style={{ padding: '8px 12px', color: r.deptId ? 'var(--cyan)' : 'var(--amber)' }}>{r.deptId ?? 'NULL'}</td>
                      <td style={{ padding: '8px 12px', color: r.deptName ? 'var(--cyan)' : 'var(--amber)' }}>{r.deptName ?? 'NULL'}</td>
                      <td style={{ padding: '8px 12px', color: r.salary ? 'var(--text-muted)' : 'var(--amber)' }}>{r.salary ? `$${r.salary.toLocaleString()}` : 'NULL'}</td>
                      <td style={{ padding: '8px 12px', color: r.location ? 'var(--text-muted)' : 'var(--amber)' }}>{r.location ?? 'NULL'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className={`badge ${isNullPadded ? 'badge-amber' : 'badge-emerald'}`}>
                          {isNullPadded ? 'NULL-Padded' : 'Inner Matched'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
