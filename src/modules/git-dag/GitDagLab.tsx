import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

interface GitCommit {
  hash: string;
  parents: string[];
  message: string;
  treeHash: string;
  author: string;
  timestamp: string;
}

export const GitDagLab: React.FC = () => {
  // Commits in the Merkle DAG
  const [commits, setCommits] = useState<GitCommit[]>([
    {
      hash: 'a1b2c3d',
      parents: [],
      message: 'Initial project boilerplate',
      treeHash: 'tree_7401aa',
      author: 'Alex <alex@odyssey.internal>',
      timestamp: '2026-10-21 00:00:00'
    },
    {
      hash: 'e4f5a6b',
      parents: ['a1b2c3d'],
      message: 'Add auth middleware & routes',
      treeHash: 'tree_8812bb',
      author: 'Alex <alex@odyssey.internal>',
      timestamp: '2026-10-21 00:15:00'
    }
  ]);

  // Branch pointers: branch name -> commit hash
  const [branches, setBranches] = useState<Record<string, string>>({
    main: 'e4f5a6b'
  });

  const [headBranch, setHeadBranch] = useState<string>('main'); // or 'DETACHED'
  const [headCommit, setHeadCommit] = useState<string>('e4f5a6b');
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null);
  const [commandInput, setCommandInput] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenges
  const [achievedBranch, setAchievedBranch] = useState<boolean>(false);
  const [achievedDivergence, setAchievedDivergence] = useState<boolean>(false);
  const [achievedReconcile, setAchievedReconcile] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Git 2.45 Merkle DAG Engine active (.git/objects/ in memory).' },
    { id: '2', type: 'output', text: 'HEAD -> refs/heads/main at commit e4f5a6b.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('git-dag')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const generateHash = () => {
    const chars = '0123456789abcdef';
    let h = '';
    for (let i = 0; i < 7; i++) h += chars[Math.floor(Math.random() * chars.length)];
    return h;
  };

  const handleCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const timestamp = Date.now();

    // 1. git commit -m "..."
    if (cmd.startsWith('git commit')) {
      const match = cmd.match(/-m\s+["']?([^"']+)["']?/);
      const msg = match ? match[1] : `Snapshot update`;
      const newHash = generateHash();
      const parentHash = headBranch !== 'DETACHED' ? branches[headBranch] : headCommit;

      const newCommit: GitCommit = {
        hash: newHash,
        parents: [parentHash],
        message: msg,
        treeHash: `tree_${generateHash()}`,
        author: 'Alex <alex@odyssey.internal>',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      setCommits(p => [...p, newCommit]);
      setHeadCommit(newHash);

      if (headBranch !== 'DETACHED') {
        setBranches(prev => ({ ...prev, [headBranch]: newHash }));
      }

      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
        { id: (timestamp + 1).toString(), type: 'success', text: `[${headBranch} ${newHash}] ${msg}\n 1 file changed, 14 insertions(+)` }
      ]);

      // Check divergence
      if (Object.keys(branches).length > 1) {
        setAchievedDivergence(true);
      }
    }
    // 2. git branch <name>
    else if (cmd.startsWith('git branch') && !cmd.includes('-d')) {
      const parts = cmd.split(' ');
      const branchName = parts[2]?.trim();
      if (!branchName) {
        // list branches
        const list = Object.keys(branches).map(b => (b === headBranch ? `* ${b}` : `  ${b}`)).join('\n');
        setLogs(p => [
          ...p,
          { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
          { id: (timestamp + 1).toString(), type: 'output', text: list }
        ]);
        return;
      }

      const targetCommit = headBranch !== 'DETACHED' ? branches[headBranch] : headCommit;
      setBranches(prev => ({ ...prev, [branchName]: targetCommit }));
      setAchievedBranch(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
        { id: (timestamp + 1).toString(), type: 'success', text: `Created refs/heads/${branchName} pointing to ${targetCommit}.` }
      ]);
    }
    // 3. git checkout [-b] <target> / git switch
    else if (cmd.startsWith('git checkout') || cmd.startsWith('git switch')) {
      const isCreate = cmd.includes('-b') || cmd.includes('-c');
      const target = cmd.replace('git checkout', '').replace('git switch', '').replace('-b', '').replace('-c', '').trim();

      if (isCreate) {
        const currentTarget = headBranch !== 'DETACHED' ? branches[headBranch] : headCommit;
        setBranches(prev => ({ ...prev, [target]: currentTarget }));
        setHeadBranch(target);
        setHeadCommit(currentTarget);
        setAchievedBranch(true);
        setLogs(p => [
          ...p,
          { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
          { id: (timestamp + 1).toString(), type: 'success', text: `Switched to a new branch '${target}'. HEAD -> refs/heads/${target}` }
        ]);
      } else {
        if (branches[target]) {
          setHeadBranch(target);
          setHeadCommit(branches[target]);
          setLogs(p => [
            ...p,
            { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
            { id: (timestamp + 1).toString(), type: 'success', text: `Switched to branch '${target}'. HEAD -> refs/heads/${target}` }
          ]);
        } else {
          // Check if it's a commit hash
          const commitObj = commits.find(c => c.hash === target);
          if (commitObj) {
            setHeadBranch('DETACHED');
            setHeadCommit(commitObj.hash);
            setLogs(p => [
              ...p,
              { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
              { id: (timestamp + 1).toString(), type: 'output', text: `Note: switching to '${target}'. You are in 'detached HEAD' state.` }
            ]);
          } else {
            setLogs(p => [
              ...p,
              { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
              { id: (timestamp + 1).toString(), type: 'error', text: `error: pathspec '${target}' did not match any file(s) known to git` }
            ]);
          }
        }
      }
    }
    // 4. git merge <source>
    else if (cmd.startsWith('git merge')) {
      const sourceBranch = cmd.replace('git merge', '').trim();
      if (!branches[sourceBranch]) {
        setLogs(p => [
          ...p,
          { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
          { id: (timestamp + 1).toString(), type: 'error', text: `merge: ${sourceBranch} - not something we can merge` }
        ]);
        return;
      }

      const currentHead = branches[headBranch];
      const sourceTarget = branches[sourceBranch];

      if (currentHead === sourceTarget) {
        setLogs(p => [
          ...p,
          { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
          { id: (timestamp + 1).toString(), type: 'output', text: `Already up to date.` }
        ]);
        return;
      }

      // Create 2-parent Merge Commit
      const mergeHash = generateHash();
      const mergeCommit: GitCommit = {
        hash: mergeHash,
        parents: [currentHead, sourceTarget],
        message: `Merge branch '${sourceBranch}' into ${headBranch}`,
        treeHash: `tree_${generateHash()}`,
        author: 'Alex <alex@odyssey.internal>',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      setCommits(p => [...p, mergeCommit]);
      setBranches(prev => ({ ...prev, [headBranch]: mergeHash }));
      setHeadCommit(mergeHash);
      setAchievedReconcile(true);

      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
        { id: (timestamp + 1).toString(), type: 'success', text: `Merge made by the 'ort' strategy. Created 2-parent merge commit ${mergeHash}.` }
      ]);
    }
    // 5. git log --oneline
    else if (cmd === 'git log' || cmd === 'git log --oneline') {
      const lines = commits.slice().reverse().map(c => {
        const branchTags = Object.entries(branches).filter(([_, h]) => h === c.hash).map(([b]) => b);
        const isH = headCommit === c.hash ? 'HEAD -> ' : '';
        const tagStr = branchTags.length > 0 || isH ? ` (${isH}${branchTags.join(', ')})` : '';
        return `${c.hash}${tagStr} ${c.message}`;
      }).join('\n');

      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
        { id: (timestamp + 1).toString(), type: 'output', text: lines }
      ]);
    } else {
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `$ ${cmd}` },
        { id: (timestamp + 1).toString(), type: 'error', text: `Command not recognized. Try: git commit -m "...", git branch <name>, git checkout -b <name>, git merge <name>, git log --oneline` }
      ]);
    }

    setCommandInput('');
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('git-dag')) {
        list.push('git-dag');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 09 (Git Merkle DAG Simulator) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Merkle Tree & Branch Pointer Invariant</span>
            <span className="badge badge-indigo">Module 09</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Git is not a delta difference tracker; it is an immutable content-addressed <strong>Merkle Directed Acyclic Graph (DAG)</strong>.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            <strong>Pointer Truth:</strong> Branches are merely 41-byte plain-text files pointing to a commit hash.
            <code> HEAD</code> is a pointer to the active branch ref (or directly to a commit in detached HEAD mode).
          </p>
        </div>

        {/* Interactive Git Shell */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>LearnGitBranching Interactive Shell</span>
            <span className="badge badge-emerald">
              HEAD → {headBranch === 'DETACHED' ? headCommit : `refs/heads/${headBranch}`}
            </span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleCommand(commandInput); }} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="e.g. git commit -m 'new feature'"
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#040711',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 12
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ fontSize: 12 }}>
              Run
            </button>
          </form>

          {/* Quick Action Shortcuts */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => handleCommand('git commit -m "Implement feature logic"')}>
              + git commit
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => handleCommand('git checkout -b feature-payment')}>
              git checkout -b feature-payment
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => handleCommand('git checkout main')}>
              git checkout main
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => handleCommand('git merge feature-payment')}>
              git merge feature-payment
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => handleCommand('git log --oneline')}>
              git log --oneline
            </button>
          </div>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Git DAG Engineering Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedBranch ? '✅' : '⏳'}</span>
              <span>Create an isolated feature branch (refs/heads/feature-*)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedDivergence ? '✅' : '⏳'}</span>
              <span>Commit on multiple branches to produce a divergent Merkle DAG</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedReconcile ? '✅' : '⏳'}</span>
              <span>Reconcile divergent branches via a 2-parent merge commit</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedBranch && achievedDivergence ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedBranch}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 09 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="POSIX Git Terminal Traces" />
      </div>

      {/* Right Column: Visual Merkle DAG Canvas & Object Inspector */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Commit Tree Directed Acyclic Graph (DAG)</span>
            <span className="badge badge-emerald">Total Objects: {commits.length} Commits</span>
          </div>

          {/* Visual DAG Horizontal Stream */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            overflowX: 'auto',
            padding: '24px 10px',
            marginBottom: 20
          }}>
            {commits.map((c) => {
              const branchPointers = Object.entries(branches).filter(([_, h]) => h === c.hash).map(([b]) => b);
              const isHeadTarget = headCommit === c.hash;
              const isSelected = selectedCommit?.hash === c.hash;

              return (
                <div
                  key={c.hash}
                  onClick={() => setSelectedCommit(c)}
                  style={{
                    minWidth: 130,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${isSelected ? 'var(--indigo)' : isHeadTarget ? 'var(--emerald)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {c.hash}
                    </span>
                    {c.parents.length > 1 && (
                      <span className="badge badge-purple" style={{ fontSize: 9 }}>Merge</span>
                    )}
                  </div>

                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.message}
                  </p>

                  {/* Branch Pointers */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {branchPointers.map(b => (
                      <span key={b} className="badge badge-indigo" style={{ fontSize: 9 }}>
                        {b}
                      </span>
                    ))}
                    {isHeadTarget && (
                      <span className="badge badge-emerald" style={{ fontSize: 9 }}>
                        ● HEAD
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Git Object Inspector (Selected Commit internal bytes) */}
          <div className="lab-card" style={{ background: '#040711' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, color: 'var(--indigo)' }}>
                {selectedCommit ? `Raw Git Object: .git/objects/${selectedCommit.hash.slice(0, 2)}/${selectedCommit.hash.slice(2)}` : 'Git Object Inspector (Click any commit node)'}
              </strong>
              <span className="badge">Zlib Decompressed</span>
            </div>

            {selectedCommit ? (
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '12px 14px',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--cyan)',
                lineHeight: 1.6
              }}>
{`tree ${selectedCommit.treeHash}
${selectedCommit.parents.map(p => `parent ${p}`).join('\n')}
author ${selectedCommit.author} ${selectedCommit.timestamp}
committer ${selectedCommit.author} ${selectedCommit.timestamp}

${selectedCommit.message}`}
              </pre>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                Click any commit card above to decompress its SHA hash and inspect tree pointers, parents, and author signatures.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
