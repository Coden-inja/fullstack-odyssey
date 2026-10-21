import React, { useState, useEffect } from 'react';

interface CommitNode {
  id: string; // e.g. "C0", "C1", "C2"
  hash: string;
  parents: string[];
  message: string;
  lane: number; // 0 for main, 1 for feature
  x: number;
  y: number;
}

interface Level {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  solutionCommands: string[];
  initialCommits: CommitNode[];
  initialBranches: Record<string, string>;
  initialHead: { branch: string | null; commit: string };
  checkWin: (commits: CommitNode[], branches: Record<string, string>, head: { branch: string | null; commit: string }) => boolean;
}

const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Level 1: Your First Commits',
    subtitle: 'Commits as Save Points',
    story: 'Imagine writing an essay or playing a video game without saving. If something breaks, everything is lost. In Git, a commit is a permanent snapshot or save point. Every commit points backward to the commit that came before it.',
    concept: 'When you make a commit with `git commit`, Git takes a snapshot of your project, generates a new node, and points it to your current commit. Your branch label (`main`) automatically slides forward to the new commit.',
    goalDescription: 'Make 2 new commits so your project history has C0, C1, and C2 on branch main.',
    hint: 'Type "git commit" in the terminal below (or click the "+ git commit" button) twice.',
    solutionCommands: ['git commit', 'git commit'],
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial project setup', lane: 0, x: 80, y: 150 }
    ],
    initialBranches: { main: 'C0' },
    initialHead: { branch: 'main', commit: 'C0' },
    checkWin: (commits, branches, head) => {
      return commits.length >= 3 && branches['main'] === commits[commits.length - 1].id;
    }
  },
  {
    id: 2,
    title: 'Level 2: Branching Out',
    subtitle: 'Branches are Just Movable Labels',
    story: 'You want to build a brand new login page, but you don’t want to break the working main website while experimenting. You need an isolated workspace: a branch.',
    concept: 'Many developers think a branch copies all your files onto your disk. It does not! A branch is literally a tiny 40-byte sticky-note label pointing to a commit hash. When you switch to a branch, `HEAD` attaches to that label.',
    goalDescription: 'Create and switch to a branch named "feature" (using git checkout -b feature), then make 1 commit on it.',
    hint: 'Run "git checkout -b feature" to create and switch branches, then run "git commit".',
    solutionCommands: ['git checkout -b feature', 'git commit'],
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 80, y: 150 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Add homepage', lane: 0, x: 200, y: 150 }
    ],
    initialBranches: { main: 'C1' },
    initialHead: { branch: 'main', commit: 'C1' },
    checkWin: (commits, branches, head) => {
      return branches['feature'] !== undefined && branches['feature'] !== branches['main'] && head.branch === 'feature';
    }
  },
  {
    id: 3,
    title: 'Level 3: Merging Two Branches',
    subtitle: 'Bringing History Together',
    story: 'Your new feature is tested and works perfectly! Now you need to bring that feature back into the main branch so the entire team has it.',
    concept: 'A merge combines two lines of history. When you run `git merge feature` while on `main`, Git creates a special "Merge Commit" that has TWO parents! It connects both branches together into one unified history.',
    goalDescription: 'Switch to the main branch (git checkout main), then merge the feature branch (git merge feature).',
    hint: 'Type "git checkout main" then type "git merge feature".',
    solutionCommands: ['git checkout main', 'git merge feature'],
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 80, y: 130 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Add basic layout', lane: 0, x: 200, y: 130 },
      { id: 'C2', hash: '6d3a84', parents: ['C1'], message: 'Build login page', lane: 1, x: 320, y: 220 }
    ],
    initialBranches: { main: 'C1', feature: 'C2' },
    initialHead: { branch: 'feature', commit: 'C2' },
    checkWin: (commits, branches, head) => {
      const mergeCommit = commits.find(c => c.parents.length === 2);
      return Boolean(mergeCommit && head.branch === 'main' && branches['main'] === mergeCommit.id);
    }
  },
  {
    id: 4,
    title: 'Level 4: Looking at the Past (Detached HEAD)',
    subtitle: 'Examining Old Checkpoints',
    story: 'A bug was reported that wasn’t there yesterday. You want to travel back in time to inspect an earlier commit exactly as it was when created.',
    concept: 'Usually, HEAD points to a branch name (HEAD -> main). But Git allows you to point HEAD directly at any commit ID. When you do `git checkout C1`, HEAD detaches from the branch label and sits directly on the commit. This is called a "Detached HEAD".',
    goalDescription: 'Point HEAD directly at commit C1 by running: git checkout C1',
    hint: 'Type "git checkout C1" in the terminal below.',
    solutionCommands: ['git checkout C1'],
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 80, y: 150 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Stable release v1.0', lane: 0, x: 200, y: 150 },
      { id: 'C2', hash: '9b2c45', parents: ['C1'], message: 'Experimental redesign', lane: 0, x: 320, y: 150 }
    ],
    initialBranches: { main: 'C2' },
    initialHead: { branch: 'main', commit: 'C2' },
    checkWin: (commits, branches, head) => {
      return head.branch === null && head.commit === 'C1';
    }
  }
];

export const GitDagLab: React.FC = () => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const level = LEVELS[currentLevelIdx];

  const [commits, setCommits] = useState<CommitNode[]>(level.initialCommits);
  const [branches, setBranches] = useState<Record<string, string>>(level.initialBranches);
  const [head, setHead] = useState<{ branch: string | null; commit: string }>(level.initialHead);

  const [inputCmd, setInputCmd] = useState<string>('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Welcome to Visual Git! Ready for Level ' + level.id + '.'
  ]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);

  // Initialize level
  useEffect(() => {
    resetLevel(currentLevelIdx);
  }, [currentLevelIdx]);

  // Check victory condition
  useEffect(() => {
    if (!levelWon && level.checkWin(commits, branches, head)) {
      setLevelWon(true);
      setTerminalHistory(prev => [...prev, `Level ${level.id} Complete! You achieved the target goal.`]);

      // Check if all 4 levels are done
      if (currentLevelIdx === LEVELS.length - 1) {
        setIsCompletedAll(true);
        saveModuleCompletion();
      }
    }
  }, [commits, branches, head, levelWon]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('git-dag')) {
        list.push('git-dag');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    const l = LEVELS[idx];
    setCommits(JSON.parse(JSON.stringify(l.initialCommits)));
    setBranches(JSON.parse(JSON.stringify(l.initialBranches)));
    setHead(JSON.parse(JSON.stringify(l.initialHead)));
    setLevelWon(false);
    setShowHint(false);
    setInputCmd('');
    setTerminalHistory([`Loaded ${l.title}. Objective: ${l.goalDescription}`]);
  };

  const executeCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    setTerminalHistory(prev => [...prev, `$ ${cmd}`]);

    // Command: git commit
    if (cmd.startsWith('git commit')) {
      const nextNum = commits.length;
      const nextId = `C${nextNum}`;
      const nextHash = Math.random().toString(16).substring(2, 8);
      const parentId = head.commit;
      const parentNode = commits.find(c => c.id === parentId) || commits[commits.length - 1];

      // Lane calculation: if head is on a feature branch, put in lane 1
      const isFeature = head.branch && head.branch !== 'main';
      const lane = isFeature ? 1 : 0;
      const x = parentNode ? parentNode.x + 120 : 100;
      const y = lane === 0 ? 130 : 220;

      const newCommit: CommitNode = {
        id: nextId,
        hash: nextHash,
        parents: [parentId],
        message: `Commit ${nextId}`,
        lane,
        x,
        y
      };

      setCommits(prev => [...prev, newCommit]);
      setHead(prev => ({ ...prev, commit: nextId }));

      if (head.branch) {
        setBranches(prev => ({ ...prev, [head.branch!]: nextId }));
        setTerminalHistory(prev => [...prev, `Created ${nextId} (${nextHash}). ${head.branch} -> ${nextId}`]);
      } else {
        setTerminalHistory(prev => [...prev, `Created ${nextId} in detached HEAD state.`]);
      }
      return;
    }

    // Command: git checkout -b <name> or git branch <name>
    if (cmd.startsWith('git checkout -b ') || cmd.startsWith('git branch ')) {
      const isSwitch = cmd.startsWith('git checkout -b ');
      const branchName = cmd.replace(isSwitch ? 'git checkout -b ' : 'git branch ', '').trim();
      if (!branchName) {
        setTerminalHistory(prev => [...prev, 'Error: missing branch name']);
        return;
      }

      setBranches(prev => ({ ...prev, [branchName]: head.commit }));
      if (isSwitch) {
        setHead({ branch: branchName, commit: head.commit });
        setTerminalHistory(prev => [...prev, `Switched to a new branch '${branchName}' at ${head.commit}`]);
      } else {
        setTerminalHistory(prev => [...prev, `Created branch '${branchName}' pointing to ${head.commit}`]);
      }
      return;
    }

    // Command: git checkout <name or id>
    if (cmd.startsWith('git checkout ')) {
      const target = cmd.replace('git checkout ', '').trim();
      if (branches[target]) {
        // Switching to branch
        setHead({ branch: target, commit: branches[target] });
        setTerminalHistory(prev => [...prev, `Switched to branch '${target}'`]);
      } else if (commits.some(c => c.id === target)) {
        // Checking out specific commit -> Detached HEAD
        setHead({ branch: null, commit: target });
        setTerminalHistory(prev => [
          ...prev,
          `Note: switching to '${target}'. You are in 'detached HEAD' state.`
        ]);
      } else {
        setTerminalHistory(prev => [...prev, `Error: pathspec '${target}' did not match any file(s) or branch known to git`]);
      }
      return;
    }

    // Command: git merge <branch>
    if (cmd.startsWith('git merge ')) {
      const targetBranch = cmd.replace('git merge ', '').trim();
      const targetCommitId = branches[targetBranch];
      if (!targetCommitId) {
        setTerminalHistory(prev => [...prev, `merge: ${targetBranch} - not something we can merge`]);
        return;
      }

      if (targetCommitId === head.commit) {
        setTerminalHistory(prev => [...prev, 'Already up to date.']);
        return;
      }

      const nextNum = commits.length;
      const nextId = `C${nextNum}`;
      const nextHash = Math.random().toString(16).substring(2, 8);
      const parent1 = head.commit;
      const parent2 = targetCommitId;

      const p1Node = commits.find(c => c.id === parent1)!;
      const p2Node = commits.find(c => c.id === parent2)!;
      const maxX = Math.max(p1Node.x, p2Node.x) + 120;

      const mergeCommit: CommitNode = {
        id: nextId,
        hash: nextHash,
        parents: [parent1, parent2],
        message: `Merge branch '${targetBranch}'`,
        lane: 0,
        x: maxX,
        y: 130
      };

      setCommits(prev => [...prev, mergeCommit]);
      setHead(prev => ({ ...prev, commit: nextId }));
      if (head.branch) {
        setBranches(prev => ({ ...prev, [head.branch!]: nextId }));
      }
      setTerminalHistory(prev => [...prev, `Merge made by the 'ort' strategy: ${nextId} (${nextHash})`]);
      return;
    }

    setTerminalHistory(prev => [...prev, `Unknown command: ${cmd}. Available: git commit, git checkout, git branch, git merge`]);
  };

  const handleAutoPlaySolution = () => {
    level.solutionCommands.forEach((cmd, idx) => {
      setTimeout(() => {
        executeCommand(cmd);
      }, idx * 600);
    });
  };

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson & Interactive Terminal */}
      <div className="guide-panel">
        {/* Level Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LEVELS.map((l, idx) => (
            <button
              key={l.id}
              className={`btn btn-sm ${currentLevelIdx === idx ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCurrentLevelIdx(idx)}
            >
              Level {l.id}
            </button>
          ))}
        </div>

        {/* Lesson Story Card */}
        <div className="lesson-card" style={{ marginBottom: 0 }}>
          <div className="lesson-step-header">
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {level.subtitle}
              </div>
              <h2 className="lesson-step-title">{level.title}</h2>
            </div>
            {levelWon && <span className="badge badge-success">Passed</span>}
          </div>

          <p className="lesson-explanation">{level.story}</p>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            <strong style={{ color: 'var(--text-main)' }}>Key Concept: </strong>
            {level.concept}
          </div>

          {/* Goal Objective Box */}
          <div className="lesson-goal-box">
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Your Objective:</div>
              <div>{level.goalDescription}</div>
            </div>
          </div>

          {/* Actions: Hint & Solution */}
          <div className="lesson-actions">
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleAutoPlaySolution}
              title="Watch the solution step-by-step"
            >
              Show Solution
            </button>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => resetLevel(currentLevelIdx)}
            >
              Reset Level
            </button>
          </div>

          {showHint && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
              <strong>Hint: </strong>{level.hint}
            </div>
          )}
        </div>

        {/* Victory Celebration Banner */}
        {levelWon && (
          <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: 14, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>Level Completed!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Great work! Ready for the next challenge?</div>
            </div>
            {currentLevelIdx < LEVELS.length - 1 ? (
              <button 
                className="btn btn-success btn-sm"
                onClick={() => setCurrentLevelIdx(currentLevelIdx + 1)}
              >
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">All Levels Mastered!</span>
            )}
          </div>
        )}

        {/* Quick Helper Action Buttons */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Quick Commands:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => executeCommand('git commit')}>
              + git commit
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => executeCommand('git checkout -b feature')}>
              git checkout -b feature
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => executeCommand('git checkout main')}>
              git checkout main
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => executeCommand('git merge feature')}>
              git merge feature
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => executeCommand('git checkout C1')}>
              git checkout C1
            </button>
          </div>
        </div>

        {/* Interactive CLI Terminal */}
        <div className="sim-terminal" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 180, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {terminalHistory.map((item, idx) => (
              <div key={idx} style={{ color: item.startsWith('$') ? '#38bdf8' : item.startsWith('Level') ? '#34d399' : '#e2e8f0' }}>
                {item}
              </div>
            ))}
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              executeCommand(inputCmd);
              setInputCmd('');
            }}
            className="sim-terminal-row"
          >
            <span className="sim-terminal-prompt">$</span>
            <input
              type="text"
              className="sim-terminal-input"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="e.g. git commit"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Run
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Live Interactive Graph Canvas */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">Git History Graph</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Circles represent commit checkpoints. Arrows link commits to their parents.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-indigo">
              HEAD: {head.branch ? `refs/heads/${head.branch}` : `Detached at ${head.commit}`}
            </span>
            <span className="badge">
              Total Commits: {commits.length}
            </span>
          </div>
        </div>

        {/* Interactive SVG Tree Visualizer */}
        <div style={{ flex: 1, border: '1px solid var(--border-light)', borderRadius: 8, background: '#fafbfc', position: 'relative', overflow: 'auto' }}>
          <svg width="100%" height="100%" viewBox="0 0 760 380" style={{ minWidth: 640, minHeight: 320 }}>
            <defs>
              <marker
                id="git-arrow"
                viewBox="0 0 10 10"
                refX="26"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Connecting Parent Arrows */}
            {commits.map(commit => {
              return commit.parents.map(parentId => {
                const parentNode = commits.find(c => c.id === parentId);
                if (!parentNode) return null;

                // Bezier curve connecting child to parent
                const d = `M ${commit.x} ${commit.y} C ${(commit.x + parentNode.x) / 2} ${commit.y}, ${(commit.x + parentNode.x) / 2} ${parentNode.y}, ${parentNode.x} ${parentNode.y}`;

                return (
                  <path
                    key={`${commit.id}->${parentId}`}
                    d={d}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="3"
                    markerEnd="url(#git-arrow)"
                  />
                );
              });
            })}

            {/* Commit Circles & Labels */}
            {commits.map(commit => {
              const isHeadCommit = head.commit === commit.id;
              const attachedBranches = Object.entries(branches).filter(([_, cid]) => cid === commit.id);

              return (
                <g key={commit.id} style={{ transition: 'all 0.3s ease' }}>
                  {/* Outer ring if current HEAD */}
                  {isHeadCommit && (
                    <circle
                      cx={commit.x}
                      cy={commit.y}
                      r={30}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Main Commit Circle */}
                  <circle
                    cx={commit.x}
                    cy={commit.y}
                    r={22}
                    fill={commit.parents.length === 2 ? '#4f46e5' : commit.lane === 1 ? '#059669' : '#2563eb'}
                    stroke="#ffffff"
                    strokeWidth="3"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />

                  {/* Commit ID Label */}
                  <text
                    x={commit.x}
                    y={commit.y + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    {commit.id}
                  </text>

                  {/* Hash & Message below */}
                  <text
                    x={commit.x}
                    y={commit.y + 40}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                  >
                    {commit.hash}
                  </text>

                  {/* Branch Labels floating above commit */}
                  {attachedBranches.map(([bName], bIdx) => (
                    <g key={bName} transform={`translate(${commit.x - 30}, ${commit.y - 40 - bIdx * 24})`}>
                      <rect
                        width={60}
                        height={20}
                        rx={4}
                        fill={bName === 'main' ? '#dbeafe' : '#d1fae5'}
                        stroke={bName === 'main' ? '#93c5fd' : '#a7f3d0'}
                      />
                      <text
                        x={30}
                        y={14}
                        textAnchor="middle"
                        fill={bName === 'main' ? '#1e40af' : '#065f46'}
                        fontSize="11"
                        fontWeight="600"
                      >
                        {bName}
                      </text>
                    </g>
                  ))}

                  {/* HEAD indicator badge */}
                  {isHeadCommit && (
                    <g transform={`translate(${commit.x - 24}, ${commit.y - 40 - attachedBranches.length * 24})`}>
                      <rect
                        width={48}
                        height={18}
                        rx={4}
                        fill="#fef3c7"
                        stroke="#fde68a"
                      />
                      <text
                        x={24}
                        y={13}
                        textAnchor="middle"
                        fill="#92400e"
                        fontSize="10"
                        fontWeight="700"
                      >
                        * HEAD
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
