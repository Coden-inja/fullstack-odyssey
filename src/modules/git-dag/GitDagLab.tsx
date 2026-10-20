import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

interface GitCommitNode {
  id: string;
  parent: string | null;
  msg: string;
  branch: string;
}

export const GitDagLab: React.FC = () => {
  const [commits, setCommits] = useState<GitCommitNode[]>([
    { id: 'c1', parent: null, msg: 'Initial baseline setup', branch: 'main' },
    { id: 'c2', parent: 'c1', msg: 'Add auth middleware', branch: 'main' }
  ]);
  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [commandInput, setCommandInput] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'In-memory GitEngine initialized (zero OS child process execution).' },
    { id: '2', type: 'output', text: 'HEAD points to refs/heads/main at commit c2.' }
  ]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('git commit')) {
      const parent = commits[commits.length - 1].id;
      const nextId = `c${commits.length + 1}`;
      const newNode: GitCommitNode = {
        id: nextId,
        parent,
        msg: trimmed.includes('-m') ? trimmed.split('-m')[1].replace(/['"]/g, '').trim() : `Snapshot ${nextId}`,
        branch: activeBranch
      };
      setCommits(p => [...p, newNode]);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: trimmed },
        { id: (Date.now() + 1).toString(), type: 'success', text: `[${activeBranch} ${nextId}] ${newNode.msg} (Parent: ${parent})` }
      ]);
    } else if (trimmed.startsWith('git branch')) {
      const branchName = trimmed.split(' ')[2] || 'feature';
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: trimmed },
        { id: (Date.now() + 1).toString(), type: 'output', text: `Created branch pointer refs/heads/${branchName}` }
      ]);
    } else if (trimmed.startsWith('git checkout')) {
      const target = trimmed.replace('git checkout', '').replace('-b', '').trim();
      setActiveBranch(target);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: trimmed },
        { id: (Date.now() + 1).toString(), type: 'success', text: `Switched to branch '${target}'. HEAD -> refs/heads/${target}` }
      ]);
    } else if (trimmed === 'git log --oneline') {
      const logLines = commits.slice().reverse().map(c => `${c.id} ${c.msg} (${c.branch})`).join('\n');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: trimmed },
        { id: (Date.now() + 1).toString(), type: 'output', text: logLines }
      ]);
    } else {
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: trimmed },
        { id: (Date.now() + 1).toString(), type: 'error', text: `Unknown command: ${trimmed}. Supported: git commit -m "...", git branch <name>, git checkout <branch>, git log --oneline` }
      ]);
    }

    setCommandInput('');
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">Interactive Git Terminal (LearnGitBranching Style)</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Type real Git commands below or use quick action shortcuts.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleCommand(commandInput); }} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="e.g. git commit -m 'new feature'"
              style={{ flex: 1, padding: '10px 14px', background: '#040711', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
            <button type="submit" className="btn btn-primary">Run</button>
          </form>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            <button className="btn btn-secondary" onClick={() => handleCommand('git commit -m "Add component"')}>
              + git commit
            </button>
            <button className="btn btn-secondary" onClick={() => handleCommand('git checkout -b feature-v2')}>
              git checkout -b feature-v2
            </button>
            <button className="btn btn-secondary" onClick={() => handleCommand('git checkout main')}>
              git checkout main
            </button>
            <button className="btn btn-secondary" onClick={() => handleCommand('git log --oneline')}>
              git log
            </button>
          </div>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Level Challenge: Branch & Commit</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p>1. Create a branch named <code>feature-v2</code>.</p>
            <p>2. Make a new commit on that branch.</p>
            <p>3. Notice how <code>HEAD</code> re-points and parent hashes link the DAG.</p>
          </div>
        </div>

        <TerminalPane logs={logs} title="Simulated Git Shell Output" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Commit Tree Directed Acyclic Graph (DAG)</span>
            <span className="badge badge-emerald">HEAD → {activeBranch}</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, overflowX: 'auto', padding: '30px 10px' }}>
            {commits.map((c, idx) => {
              const isHead = idx === commits.length - 1;
              return (
                <React.Fragment key={c.id}>
                  <div style={{
                    minWidth: 120,
                    padding: '16px 14px',
                    borderRadius: 12,
                    background: c.branch === 'main' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    border: `2px solid ${c.branch === 'main' ? 'var(--indigo)' : 'var(--emerald)'}`,
                    textAlign: 'center',
                    boxShadow: isHead ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800 }}>{c.id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.msg}</div>
                    <div style={{ marginTop: 8 }}>
                      <span className="badge" style={{ fontSize: 9 }}>{c.branch}</span>
                    </div>
                    {isHead && (
                      <div className="badge badge-indigo" style={{ marginTop: 6, fontSize: 9 }}>
                        ● HEAD
                      </div>
                    )}
                  </div>
                  {idx < commits.length - 1 && (
                    <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>←</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
