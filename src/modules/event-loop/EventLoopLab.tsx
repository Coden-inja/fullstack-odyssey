import React, { useState, useEffect } from 'react';

interface EventLoopLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  codeLines: string[];
  expectedOutput: string[];
}

const EVENT_LOOP_LEVELS: EventLoopLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Call Stack',
    subtitle: 'Synchronous Code Runs First',
    story: 'JavaScript is single-threaded: it can only do one thing at a time. The Call Stack is the brain’s checklist of what function is currently executing.',
    concept: 'When a function is called, it is pushed onto the Call Stack. When it finishes returning, it is popped off. As long as synchronous code is running on the stack, no timer or promise can run.',
    goalDescription: 'Step through the 3 synchronous lines of code to watch the Call Stack push, execute, and pop.',
    hint: 'Click "Step Next Line" 3 times until the script completes.',
    codeLines: [
      "console.log('1: First synchronous step');",
      "console.log('2: Second synchronous step');",
      "console.log('3: Third synchronous step');"
    ],
    expectedOutput: [
      '1: First synchronous step',
      '2: Second synchronous step',
      '3: Third synchronous step'
    ]
  },
  {
    id: 2,
    title: 'Level 2: Promises vs Timers',
    subtitle: 'Microtasks Jump Ahead of Timers',
    story: 'Why does Promise.then() always run before setTimeout(..., 0), even when the timer is set to zero milliseconds?',
    concept: 'JavaScript has two queues: Microtasks (Promises) and Macrotasks (Timers). The golden rule of the event loop: whenever the Call Stack empties, it drains ALL microtasks before touching any timer.',
    goalDescription: 'Run the code and observe how the Promise callback executes before the setTimeout callback.',
    hint: 'Step through the code line by line to watch the Promise queue drain before the Timer queue.',
    codeLines: [
      "console.log('1: Synchronous start');",
      "setTimeout(() => console.log('3: setTimeout callback'), 0);",
      "Promise.resolve().then(() => console.log('2: Promise microtask'));"
    ],
    expectedOutput: [
      '1: Synchronous start',
      '2: Promise microtask',
      '3: setTimeout callback'
    ]
  },
  {
    id: 3,
    title: 'Level 3: The VIP Fast-Lane',
    subtitle: 'process.nextTick Has Highest Priority',
    story: 'Node.js has a special function called process.nextTick(). It acts like a VIP pass that cuts in front of even standard Promises.',
    concept: 'process.nextTick callbacks are queued in a priority microtask queue. When the Call Stack empties, Node drains nextTick callbacks first, then Promise jobs, and only then moves to timers.',
    goalDescription: 'Observe nextTick execute before the Promise and Timer.',
    hint: 'Click "Step Next Line" or "Show Solution" to watch nextTick take priority.',
    codeLines: [
      "setTimeout(() => console.log('4: Timer callback'), 0);",
      "Promise.resolve().then(() => console.log('3: Promise callback'));",
      "process.nextTick(() => console.log('2: nextTick VIP callback'));",
      "console.log('1: Synchronous end of script');"
    ],
    expectedOutput: [
      '1: Synchronous end of script',
      '2: nextTick VIP callback',
      '3: Promise callback',
      '4: Timer callback'
    ]
  },
  {
    id: 4,
    title: 'Level 4: Background Worker Threads',
    subtitle: 'How Node.js Offloads Heavy Work',
    story: 'If JavaScript only has one thread, how can a web server hash passwords or compress files without freezing for all other users?',
    concept: 'Node.js delegates CPU-heavy tasks (like crypto and compression) to a background pool of C++ worker threads. The main JavaScript thread stays completely free to respond to other requests.',
    goalDescription: 'Watch Worker Thread 1 handle the crypto task while the main thread completes without freezing.',
    hint: 'Step through to watch the crypto task move to Worker 1, and its callback return when finished.',
    codeLines: [
      "console.log('1: Main thread starts');",
      "crypto.hashPassword('secret', () => console.log('4: Password hashed by worker'));",
      "process.nextTick(() => console.log('2: nextTick callback'));",
      "console.log('3: Main thread ready for requests');"
    ],
    expectedOutput: [
      '1: Main thread starts',
      '3: Main thread ready for requests',
      '2: nextTick callback',
      '4: Password hashed by worker'
    ]
  }
];

export const EventLoopLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = EVENT_LOOP_LEVELS[levelIdx];

  const [activeLine, setActiveLine] = useState<number>(-1);
  const [callStack, setCallStack] = useState<string[]>([]);
  const [microtasks, setMicrotasks] = useState<string[]>([]);
  const [timers, setTimers] = useState<string[]>([]);
  const [workers, setWorkers] = useState<string[]>(['Worker 1: Idle', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
  const [stdout, setStdout] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    // Check win condition: stdout matches expected output
    if (!levelWon && stdout.length === currentLevel.expectedOutput.length) {
      const match = stdout.every((line, idx) => line === currentLevel.expectedOutput[idx]);
      if (match) {
        setLevelWon(true);
        saveModuleCompletion();
      }
    }
  }, [stdout, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('event-loop')) {
        list.push('event-loop');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    setActiveLine(-1);
    setCallStack([]);
    setMicrotasks([]);
    setTimers([]);
    setWorkers(['Worker 1: Idle', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
    setStdout([]);
    setShowHint(false);
    setLevelWon(false);
  };

  const stepNext = () => {
    // Phase 1: Step through lines of code
    if (activeLine < currentLevel.codeLines.length - 1) {
      const nextLineIdx = activeLine + 1;
      setActiveLine(nextLineIdx);
      const code = currentLevel.codeLines[nextLineIdx];

      if (code.includes('console.log') && !code.includes('=>')) {
        const text = code.match(/console\.log\(['"]([^'"]+)['"]\)/)?.[1] || '';
        setCallStack([code]);
        setTimeout(() => {
          setStdout(prev => [...prev, text]);
          setCallStack([]);
        }, 300);
      } else if (code.includes('setTimeout')) {
        const text = code.match(/console\.log\(['"]([^'"]+)['"]\)/)?.[1] || '';
        setCallStack(['setTimeout(...)']);
        setTimers(prev => [...prev, text]);
        setTimeout(() => setCallStack([]), 300);
      } else if (code.includes('Promise.resolve')) {
        const text = code.match(/console\.log\(['"]([^'"]+)['"]\)/)?.[1] || '';
        setCallStack(['Promise.resolve().then(...)']);
        setMicrotasks(prev => [...prev, text]);
        setTimeout(() => setCallStack([]), 300);
      } else if (code.includes('process.nextTick')) {
        const text = code.match(/console\.log\(['"]([^'"]+)['"]\)/)?.[1] || '';
        setCallStack(['process.nextTick(...)']);
        setMicrotasks(prev => [text, ...prev]); // Prepend VIP
        setTimeout(() => setCallStack([]), 300);
      } else if (code.includes('crypto.hashPassword')) {
        setCallStack(['crypto.hashPassword(...)']);
        setWorkers(['Worker 1: Hashing password...', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
        setTimeout(() => setCallStack([]), 300);
      }
      return;
    }

    // Phase 2: Drain microtasks
    if (microtasks.length > 0) {
      const [first, ...rest] = microtasks;
      setCallStack([`Microtask: ${first}`]);
      setMicrotasks(rest);
      setTimeout(() => {
        setStdout(prev => [...prev, first]);
        setCallStack([]);
      }, 300);
      return;
    }

    // Phase 3: Drain timers
    if (timers.length > 0) {
      const [first, ...rest] = timers;
      setCallStack([`Timer: ${first}`]);
      setTimers(rest);
      setTimeout(() => {
        setStdout(prev => [...prev, first]);
        setCallStack([]);
      }, 300);
      return;
    }

    // Phase 4: Drain background worker task
    if (workers[0].includes('Hashing')) {
      setWorkers(['Worker 1: Done', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
      const text = '4: Password hashed by worker';
      setCallStack([`Worker Callback: ${text}`]);
      setTimeout(() => {
        setStdout(prev => [...prev, text]);
        setCallStack([]);
      }, 300);
    }
  };

  const autoPlaySolution = () => {
    resetLevel(levelIdx);
    let stepCount = 0;
    const maxSteps = currentLevel.codeLines.length + 3;
    const interval = setInterval(() => {
      stepNext();
      stepCount++;
      if (stepCount >= maxSteps) {
        clearInterval(interval);
      }
    }, 600);
  };

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EVENT_LOOP_LEVELS.map((lvl, idx) => (
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

          <div className="lesson-actions">
            <button className="btn btn-primary btn-sm" onClick={stepNext}>
              Step Next Line →
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered how this queue behaves.</div>
            </div>
            {levelIdx < EVENT_LOOP_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}

        {/* Code Block Inspector */}
        <div style={{ background: '#0f172a', padding: 16, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc' }}>
          <div style={{ color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>JavaScript Source:</div>
          {currentLevel.codeLines.map((line, idx) => (
            <div 
              key={idx} 
              style={{ 
                padding: '3px 6px', 
                borderRadius: 4, 
                background: activeLine === idx ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeLine === idx ? '#38bdf8' : '#e2e8f0',
                borderLeft: activeLine === idx ? '3px solid #38bdf8' : '3px solid transparent'
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Live Event Loop Visualizer */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">Event Loop Engine</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Watch frames push to the stack and callbacks drain from their respective queues.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-indigo">V8 Single Thread</span>
            <span className="badge">libuv 4-Thread Pool</span>
          </div>
        </div>

        {/* Visual Queues Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, flex: 1 }}>
          {/* Call Stack */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Call Stack (Executing)</span>
              <span className="badge">{callStack.length} Frame</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: 6, background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 6, padding: 8, minHeight: 120 }}>
              {callStack.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>
                  Stack Empty (Idle)
                </div>
              ) : (
                callStack.map((frame, idx) => (
                  <div key={idx} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', padding: '6px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                    {frame}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Microtasks Queue */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#059669', display: 'flex', justifyContent: 'space-between' }}>
              <span>Microtasks (Promises / VIP)</span>
              <span className="badge badge-success">{microtasks.length}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 6, padding: 8, minHeight: 120 }}>
              {microtasks.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>
                  Queue Drained
                </div>
              ) : (
                microtasks.map((task, idx) => (
                  <div key={idx} style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '6px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, color: 'var(--success)' }}>
                    {task}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timers Queue */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#d97706', display: 'flex', justifyContent: 'space-between' }}>
              <span>Timers (Macrotasks)</span>
              <span className="badge badge-warning">{timers.length}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 6, padding: 8, minHeight: 120 }}>
              {timers.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>
                  No Timers Waiting
                </div>
              ) : (
                timers.map((timer, idx) => (
                  <div key={idx} style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', padding: '6px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, color: '#92400e' }}>
                    {timer}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Background Worker Threads */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
              <span>libuv Worker Pool</span>
              <span className="badge">4 Threads</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 6, padding: 8, minHeight: 120 }}>
              {workers.map((w, idx) => (
                <div key={idx} style={{ padding: '6px 10px', borderRadius: 4, fontSize: 12, background: w.includes('Hashing') ? '#fee2e2' : 'var(--bg-subtle)', color: w.includes('Hashing') ? '#991b1b' : 'var(--text-muted)', fontWeight: w.includes('Hashing') ? 700 : 500 }}>
                  {w}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal Standard Output */}
        <div style={{ marginTop: 16, background: '#0f172a', padding: 14, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc' }}>
          <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>STDOUT (Console Output):</div>
          {stdout.length === 0 ? (
            <div style={{ color: '#64748b' }}>Waiting for execution output...</div>
          ) : (
            stdout.map((line, idx) => (
              <div key={idx} style={{ color: '#38bdf8' }}>
                &gt; {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
