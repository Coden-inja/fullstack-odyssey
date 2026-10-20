import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

interface GitNode {
  hash: string;
  parent: string | null;
  msg: string;
  branch: string;
}

export const GitDagSimulator: React.FC = () => {
  const [nodes, setNodes] = useState<GitNode[]>([
    { hash: 'c1', parent: null, msg: 'Initial commit', branch: 'main' },
    { hash: 'c2', parent: 'c1', msg: 'Add auth middleware', branch: 'main' }
  ]);
  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'git init (in-memory Merkle DAG initialized)' },
    { id: '2', type: 'output', text: 'HEAD points to refs/heads/main at commit c2' }
  ]);

  const commit = () => {
    const parent = nodes[nodes.length - 1].hash;
    const hash = `c${nodes.length + 1}`;
    const newNode: GitNode = { hash, parent, msg: `Feature update ${hash}`, branch: activeBranch };
    setNodes(p => [...p, newNode]);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `[${activeBranch} ${hash}] ${newNode.msg} (Parent: ${parent})` }]);
  };

  const createBranch = () => {
    const name = activeBranch === 'main' ? 'feature-payments' : 'main';
    setActiveBranch(name);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: `git checkout -b ${name} -> Switched to branch '${name}'` }]);
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 9</span>
          <span className="badge">Merkle DAG / LearnGitBranching Style</span>
        </div>
        <h2 className="sim-title">Git Directed Acyclic Graph (DAG) Engine</h2>
        <p className="sim-desc">
          Commits are immutable snapshots pointing to parent hashes. Branches are movable pointer references.
          Watch the Merkle tree grow and re-point HEAD dynamically.
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={commit}>+ git commit</button>
        <button className="btn btn-secondary" onClick={createBranch}>git checkout -b {activeBranch === 'main' ? 'feature-payments' : 'main'}</button>
        <button className="btn btn-secondary" onClick={() => setNodes([{ hash: 'c1', parent: null, msg: 'Initial commit', branch: 'main' }])}>Reset DAG</button>
      </div>

      <div className="vis-card" style={{ marginBottom: 20 }}>
        <div className="vis-card-title">
          <span>In-Memory Commit Tree</span>
          <span style={{ color: 'var(--accent-indigo)' }}>HEAD → {activeBranch}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', overflowX: 'auto' }}>
          {nodes.map((n, i) => (
            <React.Fragment key={n.hash}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 18px',
                borderRadius: 12,
                background: n.branch === 'main' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                border: `2px solid ${n.branch === 'main' ? 'var(--accent-indigo)' : 'var(--accent-cyan)'}`,
                minWidth: 100,
                textAlign: 'center'
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16 }}>{n.hash}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.msg}</span>
                {i === nodes.length - 1 && (
                  <span className="badge active" style={{ marginTop: 6, fontSize: 9 }}>HEAD ({n.branch})</span>
                )}
              </div>
              {i < nodes.length - 1 && <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>←</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <TerminalPane logs={logs} title="Git Terminal Object Graph" />
    </div>
  );
};
