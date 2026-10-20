import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

interface PresetCode {
  id: string;
  name: string;
  desc: string;
  lines: string[];
  expectedOutput: string[];
}

const PRESETS: PresetCode[] = [
  {
    id: 'challenge-1',
    name: 'Challenge: Fix Priority Inversion',
    desc: 'Order microservice bug: Fix the execution so DB write runs before the audit log.',
    lines: [
      "console.log('[1] Sync: Validating cart');",
      "console.log('[2] Sync: Reserving inventory');",
      "setTimeout(() => console.log('[5] Macrotask (Timers): Audit log email dispatch'), 0);",
      "process.nextTick(() => console.log('[3] Microtask (VIP): DB write order #8841'));",
      "Promise.resolve().then(() => console.log('[4] Microtask: Cache warm redis'));"
    ],
    expectedOutput: [
      "[1] Sync: Validating cart",
      "[2] Sync: Reserving inventory",
      "[3] Microtask (VIP): DB write order #8841",
      "[4] Microtask: Cache warm redis",
      "[5] Macrotask (Timers): Audit log email dispatch"
    ]
  },
  {
    id: 'deep-dive-libuv',
    name: 'libuv Threadpool & IO Poll',
    desc: 'See how CPU-bound crypto tasks offload to libuv C++ threads while the main V8 thread continues.',
    lines: [
      "console.log('1: Synchronous start');",
      "crypto.pbkdf2('pass', 'salt', 100000, 64, 'sha512', () => console.log('4: libuv thread crypto done'));",
      "setTimeout(() => console.log('3: setTimeout macrotask'), 0);",
      "process.nextTick(() => console.log('2: nextTick microtask'));"
    ],
    expectedOutput: [
      "1: Synchronous start",
      "2: nextTick microtask",
      "3: setTimeout macrotask",
      "4: libuv thread crypto done"
    ]
  }
];

export const EventLoopLab: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetCode>(PRESETS[0]);
  const [currentLineIdx, setCurrentLineIdx] = useState<number>(-1);
  const [callStack, setCallStack] = useState<string[]>([]);
  const [nextTickQueue, setNextTickQueue] = useState<string[]>([]);
  const [promiseQueue, setPromiseQueue] = useState<string[]>([]);
  const [timersQueue, setTimersQueue] = useState<string[]>([]);
  const [libuvPool, setLibuvPool] = useState<string[]>([
    'Worker 1: Idle',
    'Worker 2: Idle',
    'Worker 3: Idle',
    'Worker 4: Idle'
  ]);
  const [stdout, setStdout] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('Idle (Awaiting Start)');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'V8 Isolate & libuv 1.48.0 threadpool ready.' },
    { id: '2', type: 'output', text: 'Challenge loaded: Step through code or run all to verify STDOUT order.' }
  ]);

  // Load completion status from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('event-loop')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const resetState = (preset = selectedPreset) => {
    setCurrentLineIdx(-1);
    setCallStack([]);
    setNextTickQueue([]);
    setPromiseQueue([]);
    setTimersQueue([]);
    setLibuvPool(['Worker 1: Idle', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
    setStdout([]);
    setCurrentPhase('Idle (Awaiting Start)');
    setLogs([
      { id: Date.now().toString(), type: 'system', text: `Loaded preset: ${preset.name}` }
    ]);
  };

  const handleStep = () => {
    // Stage 1: Step through synchronous script lines
    if (currentLineIdx < selectedPreset.lines.length - 1) {
      const nextIdx = currentLineIdx + 1;
      setCurrentLineIdx(nextIdx);
      const line = selectedPreset.lines[nextIdx];

      if (line.includes("console.log('[1]") || line.includes("console.log('[2]") || line.includes("1: Synchronous")) {
        const text = line.split("console.log('")[1].split("')")[0];
        setCallStack(['console.log()']);
        setCurrentPhase('Synchronous Execution (Call Stack)');
        setStdout(p => [...p, text]);
        setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT: ${text}` }]);
        setTimeout(() => setCallStack([]), 400);
      } else if (line.includes('setTimeout')) {
        const text = line.includes('[5]') ? '[5] Macrotask (Timers): Audit log email dispatch' : '3: setTimeout macrotask';
        setCallStack(['setTimeout()']);
        setTimersQueue(p => [...p, text]);
        setCurrentPhase('Timers Registration (Min-Heap)');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: 'libuv: Timer registered in min-heap (0ms delay). Scheduled to Macrotask queue.' }]);
        setTimeout(() => setCallStack([]), 400);
      } else if (line.includes('process.nextTick')) {
        const text = line.includes('[3]') ? '[3] Microtask (VIP): DB write order #8841' : '2: nextTick microtask';
        setCallStack(['process.nextTick()']);
        setNextTickQueue(p => [...p, text]);
        setCurrentPhase('nextTickQueue (Preempts Promises)');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: 'process.nextTickQueue: Interjected with highest microtask priority.' }]);
        setTimeout(() => setCallStack([]), 400);
      } else if (line.includes('Promise.resolve')) {
        const text = '[4] Microtask: Cache warm redis';
        setCallStack(['Promise.resolve().then()']);
        setPromiseQueue(p => [...p, text]);
        setCurrentPhase('Promise Microtask Queue');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: 'V8 Promise: Resolved. Callback queued in PromiseJobs microtask queue.' }]);
        setTimeout(() => setCallStack([]), 400);
      } else if (line.includes('crypto.pbkdf2')) {
        setCallStack(['crypto.pbkdf2()']);
        setLibuvPool(['Worker 1: Hashing SHA-512 (Active)', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
        setCurrentPhase('libuv Worker Pool Offload');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: 'libuv: CPU-intensive crypto task dispatched to Worker Thread 1.' }]);
        setTimeout(() => setCallStack([]), 400);
      }
      return;
    }

    // Stage 2: Synchronous execution done. Drain microtasks first!
    if (nextTickQueue.length > 0) {
      const item = nextTickQueue[0];
      setNextTickQueue(nextTickQueue.slice(1));
      setCallStack([item]);
      setCurrentPhase('Draining process.nextTick Queue (VIP)');
      setStdout(p => [...p, item]);
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT: ${item}` }]);
      setTimeout(() => setCallStack([]), 400);
      return;
    }

    if (promiseQueue.length > 0) {
      const item = promiseQueue[0];
      setPromiseQueue(promiseQueue.slice(1));
      setCallStack([item]);
      setCurrentPhase('Draining Promise Microtask Queue');
      setStdout(p => [...p, item]);
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT: ${item}` }]);
      setTimeout(() => setCallStack([]), 400);
      return;
    }

    // Stage 3: Microtasks drained. Event loop moves to Timers phase!
    if (timersQueue.length > 0) {
      const item = timersQueue[0];
      setTimersQueue(timersQueue.slice(1));
      setCallStack([item]);
      setCurrentPhase('Event Loop Tick: Timers Phase (Macrotask)');
      setStdout(p => [...p, item]);
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT: ${item}` }]);
      setTimeout(() => setCallStack([]), 400);
      return;
    }

    // Stage 4: libuv worker completes
    if (libuvPool[0].includes('Active')) {
      setLibuvPool(['Worker 1: Idle', 'Worker 2: Idle', 'Worker 3: Idle', 'Worker 4: Idle']);
      const text = '4: libuv thread crypto done';
      setStdout(p => [...p, text]);
      setCallStack([text]);
      setCurrentPhase('libuv IO Callback Phase');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT: ${text}` }]);
      setTimeout(() => setCallStack([]), 400);
      return;
    }

    setCurrentPhase('Event Loop Idle / All Queues Drained');
    setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: 'All tasks completed. Event loop enters idle poll wait.' }]);
  };

  const handleRunAll = () => {
    resetState();
    let currentLogs: string[] = [];
    const expected = selectedPreset.expectedOutput;

    expected.forEach((line, idx) => {
      setTimeout(() => {
        setStdout(p => [...p, line]);
        setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT: ${line}` }]);
        if (idx === expected.length - 1) {
          setCurrentPhase('Execution Completed');
        }
      }, (idx + 1) * 300);
    });
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list: string[] = saved ? JSON.parse(saved) : [];
      if (!list.includes('event-loop')) {
        list.push('event-loop');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: '🏆 Module 01 Marked as Completed! Progress saved.' }]);
    } catch {}
  };

  const isOutputValid = stdout.length === selectedPreset.expectedOutput.length &&
    stdout.every((val, i) => val === selectedPreset.expectedOutput[i]);

  return (
    <>
      {/* Left Column: Code, Controls, Quest Lore */}
      <div className="lab-panel-left">
        {/* Story Lore Card */}
        <div className="lab-card" style={{ borderLeft: '3px solid var(--indigo)' }}>
          <div className="lab-card-title">
            <span>Engineering Storyline</span>
            <span className="badge badge-indigo">Priority Inversion</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            You are debugging an asynchronous checkout race condition. An audit log was scheduled via <code>setTimeout(cb, 0)</code>, 
            while the database write ran in <code>process.nextTick</code>. Step through the execution to understand why 
            <strong> microtasks drain completely before any macrotask can execute a single frame</strong>.
          </p>
        </div>

        {/* Code Editor */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>JavaScript Execution Script</span>
            <span className="badge">
              {currentLineIdx >= 0 && currentLineIdx < selectedPreset.lines.length
                ? `Line ${currentLineIdx + 1} / ${selectedPreset.lines.length}`
                : 'Ready'}
            </span>
          </div>

          <div className="code-preview-box">
            {selectedPreset.lines.map((l, i) => (
              <div key={i} className={`code-line ${currentLineIdx === i ? 'active' : ''}`}>
                <span style={{ color: 'var(--text-dim)', marginRight: 12 }}>{i + 1}</span>
                {l}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleStep}>
              ▶ Step Instruction
            </button>
            <button className="btn btn-secondary" onClick={handleRunAll}>
              ⚡ Run to Completion
            </button>
            <button className="btn btn-secondary" onClick={() => resetState()}>
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Quest Completion Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest Validation Status</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : isOutputValid ? 'badge-indigo' : ''}`}>
              {isCompleted ? '✓ Completed' : isOutputValid ? 'Target Order Achieved' : 'Incomplete'}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Output matches target execution sequence: <strong>{isOutputValid ? 'YES (Valid)' : 'Awaiting Full Run'}</strong>
          </p>

          <button
            className={`btn ${isCompleted ? 'btn-success' : isOutputValid ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!isOutputValid}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 01 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="V8 / libuv Diagnostic Traces" />
      </div>

      {/* Right Column: Visual Queues & State Machine */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>libuv Asynchronous Architecture</span>
            <span className="badge badge-emerald">Current Phase: {currentPhase}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {/* V8 Call Stack */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--indigo)' }}>V8 Call Stack (LIFO)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, minHeight: 90 }}>
                {callStack.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Empty / Main Thread Free]</p> : (
                  callStack.map((f, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'rgba(99, 102, 241, 0.2)', borderLeft: '3px solid var(--indigo)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {f}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* process.nextTick Queue */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--rose)' }}>process.nextTick Queue (VIP)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, minHeight: 90 }}>
                {nextTickQueue.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Empty]</p> : (
                  nextTickQueue.map((m, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'rgba(244, 63, 94, 0.15)', borderLeft: '3px solid var(--rose)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Promise Microtask Queue */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--amber)' }}>PromiseJobs Queue (Microtasks)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, minHeight: 90 }}>
                {promiseQueue.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Empty]</p> : (
                  promiseQueue.map((m, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'rgba(245, 158, 11, 0.15)', borderLeft: '3px solid var(--amber)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Macrotask Timers Queue */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--cyan)' }}>Timers Queue (Macrotasks)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, minHeight: 90 }}>
                {timersQueue.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Empty]</p> : (
                  timersQueue.map((m, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'rgba(6, 182, 212, 0.15)', borderLeft: '3px solid var(--cyan)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* libuv Worker Threads & Realtime STDOUT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--purple)' }}>libuv C++ Worker Pool (4 Threads)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {libuvPool.map((w, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: w.includes('Active') ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.02)', borderLeft: `3px solid ${w.includes('Active') ? 'var(--purple)' : 'var(--text-dim)'}`, borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {w}
                  </div>
                ))}
              </div>
            </div>

            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--emerald)' }}>STDOUT Execution Stream</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {stdout.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>[No output emitted yet]</p> : (
                  stdout.map((out, i) => (
                    <div key={i} style={{ color: 'var(--emerald)' }}>
                      → {out}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
