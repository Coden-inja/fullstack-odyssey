import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Copy, Check } from 'lucide-react';

interface CommitNode {
  id: string; // e.g. "C0", "C1", "C2"
  hash: string;
  parents: string[];
  message: string;
  lane: number; // 0 for main, 1 for feature
  x: number;
  y: number;
}

interface ValidationResult {
  passed: boolean;
  message: string;
  remedy?: string;
}

interface Level {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  lookAt: string[];
  allowedButtons: { label: string; cmd: string }[];
  solutionCommands: string[];
  nextLevelTeaser?: string;
  nextLevelButtonLabel?: string;
  initialCommits: CommitNode[];
  initialBranches: Record<string, string>;
  initialHead: { branch: string | null; commit: string };
  goalCommits: CommitNode[];
  goalBranches: Record<string, string>;
  goalHead: { branch: string | null; commit: string };
  validateAnswer: (commits: CommitNode[], branches: Record<string, string>, head: { branch: string | null; commit: string }) => ValidationResult;
}

const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Level 1: Your First Commits',
    subtitle: 'Commits as Save Points',
    story: 'Imagine writing an essay without saving. If something crashes, everything is lost. In Git, a commit is a permanent snapshot or checkpoint. Every commit remembers the checkpoint that came before it.',
    concept: 'When you run `git commit`, Git takes a snapshot, creates a new circle, and draws an arrow pointing BACKWARD to your previous checkpoint. Your branch label (`main`) automatically slides forward.',
    goalDescription: 'Create 2 new commits so your project history has C0, C1, and C2 on branch main.',
    hint: 'Type "git commit" in the terminal below (or click "+ git commit") twice, then click "Check My Answer".',
    lookAt: [
      'Look at circle C0: That is your initial project checkpoint.',
      'Look at blue label "main": That is your branch name (a movable sticky note).',
      'Look at badge "* HEAD": That shows which checkpoint you are currently looking at.'
    ],
    solutionCommands: ['git commit', 'git commit'],
    allowedButtons: [
      { label: '+ git commit', cmd: 'git commit' }
    ],
    nextLevelTeaser: 'You mastered commits on main! But what if two developers want to work at the same time without stepping on each other\'s toes? That is why branches exist.',
    nextLevelButtonLabel: 'Continue to Level 2: Branching Out →',
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial project setup', lane: 0, x: 70, y: 110 }
    ],
    initialBranches: { main: 'C0' },
    initialHead: { branch: 'main', commit: 'C0' },
    goalCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial project setup', lane: 0, x: 70, y: 110 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Commit C1', lane: 0, x: 170, y: 110 },
      { id: 'C2', hash: '3d8a14', parents: ['C1'], message: 'Commit C2', lane: 0, x: 270, y: 110 }
    ],
    goalBranches: { main: 'C2' },
    goalHead: { branch: 'main', commit: 'C2' },
    validateAnswer: (commits, branches, head) => {
      if (commits.length < 3) {
        return {
          passed: false,
          message: `Goal requires 3 commits (C0, C1, C2), but your history currently has ${commits.length}.`,
          remedy: 'Run "git commit" to create the remaining commit(s).'
        };
      }
      if (branches['main'] !== 'C2') {
        return {
          passed: false,
          message: `Branch "main" should be pointing to C2, but is currently pointing to ${branches['main'] || 'unknown'}.`,
          remedy: 'Make sure your commits are on branch main.'
        };
      }
      if (head.branch !== 'main') {
        return {
          passed: false,
          message: 'HEAD should be attached to branch "main".',
          remedy: 'Run "git checkout main".'
        };
      }
      return {
        passed: true,
        message: 'Perfect! You created C1 and C2, and branch "main" moved forward to mark the latest checkpoint!'
      };
    }
  },
  {
    id: 2,
    title: 'Level 2: Branching Out',
    subtitle: 'Branches are Just Movable Labels',
    story: 'You want to build an experimental login page, but you do not want to break the working main website while tinkering. You need an isolated workspace: a branch.',
    concept: 'Beginners think creating a branch copies all project files into a new folder on disk. It does not! A branch is literally a 40-byte sticky-note label pointing to a commit hash.',
    goalDescription: 'Create and switch to a new branch named "feature", then make 1 commit on it.',
    hint: 'Run "git checkout -b feature" to create and switch branches, then run "git commit".',
    lookAt: [
      'Notice you currently have C0 and C1 on branch main.',
      'Goal shows a lower lane branching off with commit C2 and label "feature".',
      'Notice that branch "main" stays safe at C1 while "feature" advances!'
    ],
    solutionCommands: ['git checkout -b feature', 'git commit'],
    allowedButtons: [
      { label: 'git checkout -b feature', cmd: 'git checkout -b feature' },
      { label: '+ git commit', cmd: 'git commit' }
    ],
    nextLevelTeaser: 'You created a divergent branch! Main stayed safe while feature moved forward. But how do you combine that feature back into main?',
    nextLevelButtonLabel: 'Continue to Level 3: Merging Two Branches →',
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 70, y: 90 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Add homepage', lane: 0, x: 170, y: 90 }
    ],
    initialBranches: { main: 'C1' },
    initialHead: { branch: 'main', commit: 'C1' },
    goalCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 70, y: 90 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Add homepage', lane: 0, x: 170, y: 90 },
      { id: 'C2', hash: '6d3a84', parents: ['C1'], message: 'Build login page', lane: 1, x: 270, y: 160 }
    ],
    goalBranches: { main: 'C1', feature: 'C2' },
    goalHead: { branch: 'feature', commit: 'C2' },
    validateAnswer: (commits, branches, head) => {
      if (!branches['feature']) {
        return {
          passed: false,
          message: 'Branch "feature" does not exist yet.',
          remedy: 'Run "git checkout -b feature" to create and switch to it.'
        };
      }
      if (branches['feature'] === branches['main']) {
        return {
          passed: false,
          message: 'Branch "feature" was created, but you haven\'t made a commit on it yet.',
          remedy: 'Run "git commit" while on the feature branch.'
        };
      }
      if (head.branch !== 'feature') {
        return {
          passed: false,
          message: 'HEAD should be on branch "feature".',
          remedy: 'Run "git checkout feature".'
        };
      }
      return {
        passed: true,
        message: 'Aha! You created branch "feature" and committed on it. Notice main stayed safe at C1 while feature branched out!'
      };
    }
  },
  {
    id: 3,
    title: 'Level 3: Merging Two Branches',
    subtitle: 'Bringing History Together',
    story: 'Your feature branch is tested and works! Now you need to bring that feature back into the main branch so the rest of the team can use it.',
    concept: 'A merge combines two lines of history. When you run `git merge feature` while on `main`, Git creates a special "Merge Commit" that has TWO parents! It connects both branches together into one unified history.',
    goalDescription: 'Switch to main (git checkout main), then merge the feature branch (git merge feature).',
    hint: 'Type "git checkout main" then type "git merge feature", then click "Check My Answer".',
    lookAt: [
      'Notice you are currently standing on branch "feature" at C2.',
      'Notice the goal tree has a new commit C3 with TWO arrows pointing back to C1 and C2.',
      'Remember: You must always stand on the branch that RECEIVES the changes!'
    ],
    solutionCommands: ['git checkout main', 'git merge feature'],
    allowedButtons: [
      { label: 'git checkout main', cmd: 'git checkout main' },
      { label: 'git merge feature', cmd: 'git merge feature' }
    ],
    nextLevelTeaser: 'You merged two histories! But what if an unexpected bug was introduced yesterday and you need to inspect an earlier commit directly without modifying your current branches?',
    nextLevelButtonLabel: 'Continue to Level 4: Looking at the Past (Detached HEAD) →',
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 70, y: 90 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Add layout', lane: 0, x: 170, y: 90 },
      { id: 'C2', hash: '6d3a84', parents: ['C1'], message: 'Build login page', lane: 1, x: 270, y: 160 }
    ],
    initialBranches: { main: 'C1', feature: 'C2' },
    initialHead: { branch: 'feature', commit: 'C2' },
    goalCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 70, y: 90 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Add layout', lane: 0, x: 170, y: 90 },
      { id: 'C2', hash: '6d3a84', parents: ['C1'], message: 'Build login page', lane: 1, x: 270, y: 160 },
      { id: 'C3', hash: '9b4f21', parents: ['C1', 'C2'], message: 'Merge feature', lane: 0, x: 370, y: 90 }
    ],
    goalBranches: { main: 'C3', feature: 'C2' },
    goalHead: { branch: 'main', commit: 'C3' },
    validateAnswer: (commits, branches, head) => {
      const mergeNode = commits.find(c => c.parents.length === 2);
      if (!mergeNode) {
        return {
          passed: false,
          message: 'No merge commit found in your history.',
          remedy: 'Make sure you switched to main ("git checkout main") and merged feature ("git merge feature").'
        };
      }
      if (head.branch !== 'main') {
        return {
          passed: false,
          message: 'HEAD should be on branch "main" after merging.',
          remedy: 'Run "git checkout main".'
        };
      }
      if (branches['main'] !== mergeNode.id) {
        return {
          passed: false,
          message: `Branch "main" is not pointing to the merge commit ${mergeNode.id}.`,
          remedy: 'Run "git merge feature" while standing on main.'
        };
      }
      return {
        passed: true,
        message: 'Mastered! You created a 2-parent merge commit that successfully joined divergent histories.'
      };
    }
  },
  {
    id: 4,
    title: 'Level 4: Looking at the Past (Detached HEAD)',
    subtitle: 'Examining Old Checkpoints',
    story: 'A bug was reported that was not present yesterday. You want to travel back in time to inspect commit C1 exactly as it was when created.',
    concept: 'Usually, HEAD points to a branch label (HEAD -> main). But Git allows you to point HEAD directly at any commit ID! When you do `git checkout C1`, HEAD unhooks from the branch and sits directly on the circle. This is called a "Detached HEAD".',
    goalDescription: 'Point HEAD directly at commit C1 by typing: git checkout C1',
    hint: 'Type "git checkout C1" in the terminal below, then click "Check My Answer".',
    lookAt: [
      'Notice HEAD is currently attached to label "main" at C2.',
      'In the goal tree, notice "* HEAD" is sitting directly on circle C1 without any branch label!',
      'This lets you inspect past code checkpoints without modifying your branches.'
    ],
    solutionCommands: ['git checkout C1'],
    allowedButtons: [
      { label: 'git checkout C1', cmd: 'git checkout C1' },
      { label: 'git checkout main', cmd: 'git checkout main' }
    ],
    initialCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 70, y: 110 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Stable release v1.0', lane: 0, x: 170, y: 110 },
      { id: 'C2', hash: '9b2c45', parents: ['C1'], message: 'Experimental redesign', lane: 0, x: 270, y: 110 }
    ],
    initialBranches: { main: 'C2' },
    initialHead: { branch: 'main', commit: 'C2' },
    goalCommits: [
      { id: 'C0', hash: '8a1b2c', parents: [], message: 'Initial setup', lane: 0, x: 70, y: 110 },
      { id: 'C1', hash: '4f9e21', parents: ['C0'], message: 'Stable release v1.0', lane: 0, x: 170, y: 110 },
      { id: 'C2', hash: '9b2c45', parents: ['C1'], message: 'Experimental redesign', lane: 0, x: 270, y: 110 }
    ],
    goalBranches: { main: 'C2' },
    goalHead: { branch: null, commit: 'C1' },
    validateAnswer: (commits, branches, head) => {
      if (head.branch !== null) {
        return {
          passed: false,
          message: `HEAD is still attached to branch "${head.branch}". It needs to be detached.`,
          remedy: 'Run "git checkout C1" to point HEAD directly to commit C1.'
        };
      }
      if (head.commit !== 'C1') {
        return {
          passed: false,
          message: `HEAD is pointing to ${head.commit}, but it should point to C1.`,
          remedy: 'Run "git checkout C1".'
        };
      }
      return {
        passed: true,
        message: 'Aha! You detached HEAD! HEAD is now resting directly on commit C1, allowing you to inspect the past.'
      };
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
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    resetLevel(currentLevelIdx);
  }, [currentLevelIdx]);

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
    setValidation(null);
    setShowHint(false);
    setInputCmd('');
    setTerminalHistory([`Loaded ${l.title}. Objective: ${l.goalDescription}`]);
  };

  const handleCheckAnswer = () => {
    const res = level.validateAnswer(commits, branches, head);
    setValidation(res);

    if (res.passed) {
      setTerminalHistory(prev => [...prev, `Verification Passed: ${res.message}`]);
      if (currentLevelIdx === LEVELS.length - 1) {
        saveModuleCompletion();
      }
    } else {
      setTerminalHistory(prev => [...prev, `Check Failed: ${res.message}`]);
    }
  };

  const executeCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    setTerminalHistory(prev => [...prev, `$ ${cmd}`]);
    setValidation(null); // Clear previous validation on new action

    // Command: git commit
    if (cmd.startsWith('git commit')) {
      const nextNum = commits.length;
      const nextId = `C${nextNum}`;
      const nextHash = Math.random().toString(16).substring(2, 8);
      const parentId = head.commit;
      const parentNode = commits.find(c => c.id === parentId) || commits[commits.length - 1];

      const isFeature = head.branch && head.branch !== 'main';
      const lane = isFeature ? 1 : 0;
      const x = parentNode ? parentNode.x + 100 : 100;
      const y = lane === 0 ? (level.id === 2 || level.id === 3 ? 90 : 110) : 160;

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
        setHead({ branch: target, commit: branches[target] });
        setTerminalHistory(prev => [...prev, `Switched to branch '${target}'`]);
      } else if (commits.some(c => c.id === target)) {
        setHead({ branch: null, commit: target });
        setTerminalHistory(prev => [
          ...prev,
          `Note: switching to '${target}'. You are in 'detached HEAD' state.`
        ]);
      } else {
        setTerminalHistory(prev => [...prev, `Error: pathspec '${target}' did not match any branch or commit`]);
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
      const maxX = Math.max(p1Node.x, p2Node.x) + 100;

      const mergeCommit: CommitNode = {
        id: nextId,
        hash: nextHash,
        parents: [parent1, parent2],
        message: `Merge branch '${targetBranch}'`,
        lane: 0,
        x: maxX,
        y: 90
      };

      setCommits(prev => [...prev, mergeCommit]);
      setHead(prev => ({ ...prev, commit: nextId }));
      if (head.branch) {
        setBranches(prev => ({ ...prev, [head.branch!]: nextId }));
      }
      setTerminalHistory(prev => [...prev, `Merge made: ${nextId} (${nextHash}) with parents ${parent1} and ${parent2}`]);
      return;
    }

    setTerminalHistory(prev => [...prev, `Unknown command: ${cmd}. Available: git commit, git checkout, git branch, git merge`]);
  };

  const handleAutoPlaySolution = () => {
    resetLevel(currentLevelIdx);
    level.solutionCommands.forEach((cmd, idx) => {
      setTimeout(() => {
        executeCommand(cmd);
        if (idx === level.solutionCommands.length - 1) {
          setTimeout(() => handleCheckAnswer(), 400);
        }
      }, (idx + 1) * 500);
    });
  };

  // Helper renderer for SVG graph
  const renderSvgGraph = (
    cList: CommitNode[],
    bList: Record<string, string>,
    hState: { branch: string | null; commit: string },
    width = 460,
    height = 200,
    isMini = false
  ) => {
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <marker
            id={`arrow-${isMini ? 'mini' : 'main'}`}
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Connecting Arrows */}
        {cList.map(commit => {
          return commit.parents.map(parentId => {
            const parentNode = cList.find(c => c.id === parentId);
            if (!parentNode) return null;

            const d = `M ${commit.x} ${commit.y} C ${(commit.x + parentNode.x) / 2} ${commit.y}, ${(commit.x + parentNode.x) / 2} ${parentNode.y}, ${parentNode.x} ${parentNode.y}`;

            return (
              <path
                key={`${commit.id}->${parentId}`}
                d={d}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={isMini ? 2 : 3}
                markerEnd={`url(#arrow-${isMini ? 'mini' : 'main'})`}
              />
            );
          });
        })}

        {/* Circles & Labels */}
        {cList.map(commit => {
          const isHeadCommit = hState.commit === commit.id;
          const attachedBranches = Object.entries(bList).filter(([_, cid]) => cid === commit.id);
          const r = isMini ? 16 : 20;

          return (
            <g key={commit.id}>
              {/* Outer halo if active HEAD */}
              {isHeadCommit && (
                <circle
                  cx={commit.x}
                  cy={commit.y}
                  r={r + 6}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Commit Circle */}
              <circle
                cx={commit.x}
                cy={commit.y}
                r={r}
                fill={commit.parents.length === 2 ? '#4f46e5' : commit.lane === 1 ? '#059669' : '#2563eb'}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Commit ID */}
              <text
                x={commit.x}
                y={commit.y + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={isMini ? 10 : 11}
                fontWeight="bold"
                fontFamily="var(--font-mono)"
              >
                {commit.id}
              </text>

              {/* Attached Branch Labels */}
              {attachedBranches.map(([bName], bIdx) => (
                <g key={bName} transform={`translate(${commit.x - 24}, ${commit.y - (isMini ? 28 : 34) - bIdx * 18})`}>
                  <rect
                    width={48}
                    height={16}
                    rx={3}
                    fill={bName === 'main' ? '#dbeafe' : '#d1fae5'}
                    stroke={bName === 'main' ? '#93c5fd' : '#a7f3d0'}
                  />
                  <text
                    x={24}
                    y={11}
                    textAnchor="middle"
                    fill={bName === 'main' ? '#1e40af' : '#065f46'}
                    fontSize="9"
                    fontWeight="700"
                  >
                    {bName}
                  </text>
                </g>
              ))}

              {/* HEAD Label */}
              {isHeadCommit && (
                <g transform={`translate(${commit.x - 20}, ${commit.y - (isMini ? 28 : 34) - attachedBranches.length * 18})`}>
                  <rect
                    width={40}
                    height={14}
                    rx={3}
                    fill="#fef3c7"
                    stroke="#fde68a"
                  />
                  <text
                    x={20}
                    y={10}
                    textAnchor="middle"
                    fill="#92400e"
                    fontSize="8"
                    fontWeight="800"
                  >
                    * HEAD
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson & Diagnostic Check */}
      <div className="guide-panel">
        {/* Level Navigation */}
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

        {/* Step-by-Step Cognitive Guide Card */}
        <div className="lesson-card" style={{ marginBottom: 0 }}>
          <div className="lesson-step-header">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {level.subtitle}
              </div>
              <h2 className="lesson-step-title">{level.title}</h2>
            </div>
            {validation?.passed && <span className="badge badge-success">Passed ✓</span>}
          </div>

          <p className="lesson-explanation">{level.story}</p>

          {/* Look At Anchor Section */}
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12, color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>👀 Look at the screen right now:</div>
            {level.lookAt.map((point, idx) => (
              <div key={idx} style={{ marginBottom: 2 }}>• {point}</div>
            ))}
          </div>

          {/* Objective Box */}
          <div className="lesson-goal-box">
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>🎯 Your Goal:</div>
              <div>{level.goalDescription}</div>
            </div>
          </div>

          {/* Submission and Assistance Actions */}
          <div className="lesson-actions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCheckAnswer} style={{ fontWeight: 700 }}>
              🔍 Check My Answer
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowHint(!showHint)}>
              {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleAutoPlaySolution}>
              Show Solution
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => resetLevel(currentLevelIdx)}>
              Reset
            </button>
          </div>

          {showHint && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
              <strong>Hint: </strong>{level.hint}
            </div>
          )}
        </div>

        {/* Diagnostic Feedback Banner */}
        {validation && (
          <div
            style={{
              background: validation.passed ? 'var(--success-light)' : 'var(--danger-light)',
              border: `1px solid ${validation.passed ? 'var(--success-border)' : 'var(--danger-border)'}`,
              padding: 14,
              borderRadius: 8
            }}
          >
            <div style={{ fontWeight: 700, color: validation.passed ? 'var(--success)' : 'var(--danger)', marginBottom: 4 }}>
              {validation.passed ? 'Level Completed Successfully!' : 'Check Result: Needs Adjustment'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: validation.remedy ? 8 : 0 }}>
              {validation.message}
            </div>
            {validation.remedy && (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
                👉 What to fix: {validation.remedy}
              </div>
            )}
            {validation.passed && currentLevelIdx < LEVELS.length - 1 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--success-border)' }}>
                {level.nextLevelTeaser && (
                  <div style={{ fontSize: 12, color: 'var(--text-main)', marginBottom: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                    💡 <strong>What's Next:</strong> {level.nextLevelTeaser}
                  </div>
                )}
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setCurrentLevelIdx(currentLevelIdx + 1)}
                  style={{ fontWeight: 700 }}
                >
                  {level.nextLevelButtonLabel || `Advance to Level ${currentLevelIdx + 2} →`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Authentic macOS Interactive CLI Terminal */}
        <div className="terminal-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <span className="terminal-title">
              <TerminalIcon size={12} style={{ color: '#38bdf8' }} />
              GIT REPO TERMINAL — {head.branch ? `(${head.branch})` : `(HEAD detached at ${head.commit})`}
            </span>
            <div style={{ width: 36 }} />
          </div>

          <div className="terminal-body" style={{ flex: 1, maxHeight: 150, overflowY: 'auto' }}>
            {terminalHistory.map((item, idx) => (
              <div 
                key={idx} 
                className="terminal-line" 
                style={{ 
                  color: item.startsWith('$') ? '#38bdf8' : item.startsWith('Verification Passed') ? '#4ade80' : item.startsWith('Check Failed') ? '#f87171' : '#cbd5e1' 
                }}
              >
                <span className="glyph" style={{ color: item.startsWith('$') ? '#38bdf8' : item.startsWith('Verification') ? '#4ade80' : item.startsWith('Check') ? '#f87171' : '#a1a1aa' }}>
                  {item.startsWith('$') ? '→' : item.startsWith('Verification') ? '✓' : item.startsWith('Check') ? '✗' : '•'}
                </span>
                <span>{item.startsWith('$ ') ? item.slice(2) : item}</span>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeCommand(inputCmd);
              setInputCmd('');
            }}
            className="terminal-prompt-row"
            style={{ margin: '0 12px 12px' }}
          >
            <span className="terminal-prompt-glyph">→</span>
            <input
              type="text"
              className="terminal-prompt-input"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="Type command (e.g. git commit, git branch bugfix)..."
            />
            <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '4px 12px', fontSize: 11, borderRadius: 6 }}>
              <CornerDownLeft size={11} />
              Run
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Side-by-Side Goal Target vs Current History */}
      <div className="canvas-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Goal Canvas Box */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
              🎯 Target Goal Tree (What your graph must match)
            </span>
            <span className="badge">Goal State</span>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 6, overflow: 'auto' }}>
            {renderSvgGraph(level.goalCommits, level.goalBranches, level.goalHead, 460, 160, true)}
          </div>
        </div>

        {/* Your Live Current Canvas Box */}
        <div style={{ flex: 1, background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                Your Current Git Tree (Interactive)
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                HEAD: {head.branch ? `refs/heads/${head.branch}` : `Detached at ${head.commit}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {level.allowedButtons.map(btn => (
                <button
                  key={btn.label}
                  className="btn btn-outline btn-sm"
                  onClick={() => executeCommand(btn.cmd)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, background: '#fafbfc', border: '1px solid var(--border-light)', borderRadius: 6, overflow: 'auto' }}>
            {renderSvgGraph(commits, branches, head, 500, 200, false)}
          </div>
        </div>
      </div>
    </div>
  );
};
