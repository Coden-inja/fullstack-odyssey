import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const EventLoopLab: React.FC = () => {
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [callStack, setCallStack] = useState<string[]>([]);
  const [microtasks, setMicrotasks] = useState<string[]>([]);
  const [macrotasks, setMacrotasks] = useState<string[]>([]);
  const [libuvThreads, setLibuvThreads] = useState<string[]>(['Thread 1: Idle', 'Thread 2: Idle', 'Thread 3: Idle', 'Thread 4: Idle']);
  const [phase, setPhase] = useState<string>('Initialization');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Node.js v22.17.1 (libuv 1.48.0) runtime initialized.' },
    { id: '2', type: 'output', text: 'Ready to step through asynchronous JavaScript execution.' }
  ]);

  const codeSnippet = [
    "console.log('1: Synchronous start');",
    "setTimeout(() => console.log('2: Timeout macrotask'), 0);",
    "Promise.resolve().then(() => console.log('3: Promise microtask'));",
    "process.nextTick(() => console.log('4: nextTick urgent microtask'));",
    "crypto.pbkdf2('pass', 'salt', 100000, 64, 'sha512', () => console.log('5: libuv worker crypto'));",
    "console.log('6: Synchronous end');"
  ];

  const stepExecution = () => {
    if (currentLine === 0) {
      setCurrentLine(1);
      setCallStack(['console.log(1)']);
      setPhase('Synchronous Call Stack');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: 'STDOUT: 1: Synchronous start' }]);
    } else if (currentLine === 1) {
      setCurrentLine(2);
      setCallStack(['setTimeout()']);
      setMacrotasks(p => [...p, 'cb: Timeout (0ms)']);
      setPhase('Timers Phase Registration');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: 'libuv: Timer registered in min-heap (0ms delay). Scheduled to Macrotask queue.' }]);
    } else if (currentLine === 2) {
      setCurrentLine(3);
      setCallStack(['Promise.resolve()']);
      setMicrotasks(p => [...p, 'cb: Promise.then()']);
      setPhase('Microtask Queueing');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: 'V8 Engine: Promise resolved. Callback appended to Microtask queue.' }]);
    } else if (currentLine === 3) {
      setCurrentLine(4);
      setCallStack(['process.nextTick()']);
      setMicrotasks(p => ['cb: process.nextTick() [VIP]', ...p]);
      setPhase('nextTick Priority Ingestion');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: 'process.nextTickQueue: Interjected at index 0 of microtasks (higher priority than Promise.then).' }]);
    } else if (currentLine === 4) {
      setCurrentLine(5);
      setCallStack(['crypto.pbkdf2()']);
      setLibuvThreads(['Thread 1: Hashing SHA-512 (Active)', 'Thread 2: Idle', 'Thread 3: Idle', 'Thread 4: Idle']);
      setPhase('libuv C++ Offload');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: 'libuv: Offloaded CPU-heavy crypto work to background C++ Thread Pool (Thread 1).' }]);
    } else if (currentLine === 5) {
      setCurrentLine(6);
      setCallStack(['console.log(6)']);
      setPhase('Synchronous End');
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: 'STDOUT: 6: Synchronous end (Main script turns complete)' }]);
    } else if (currentLine === 6) {
      // Drain microtasks
      if (microtasks.length > 0) {
        const top = microtasks[0];
        setMicrotasks(microtasks.slice(1));
        setCallStack([top]);
        setPhase('Draining Microtasks');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT from microtask: ${top}` }]);
      } else if (macrotasks.length > 0) {
        const macro = macrotasks[0];
        setMacrotasks(macrotasks.slice(1));
        setCallStack([macro]);
        setPhase('Event Loop Tick: Timers Phase');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `STDOUT from macrotask: ${macro}` }]);
      } else {
        setCallStack([]);
        setLibuvThreads(['Thread 1: Idle', 'Thread 2: Idle', 'Thread 3: Idle', 'Thread 4: Idle']);
        setPhase('Event Loop Idle / Drained');
        setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: 'All queues drained. Event loop enters idle poll state.' }]);
        setCurrentLine(7);
      }
    }
  };

  const resetSimulator = () => {
    setCurrentLine(0);
    setCallStack([]);
    setMicrotasks([]);
    setMacrotasks([]);
    setLibuvThreads(['Thread 1: Idle', 'Thread 2: Idle', 'Thread 3: Idle', 'Thread 4: Idle']);
    setPhase('Initialization');
    setLogs([{ id: Date.now().toString(), type: 'system', text: 'Reset simulator to initial state.' }]);
  };

  return (
    <>
      {/* Left Column: Code Editor & Controls */}
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">
            <span>JavaScript Source Code</span>
            <span className="badge badge-indigo">Line {currentLine < 6 ? currentLine + 1 : 'Draining'} / 6</span>
          </div>
          <div className="code-preview-box">
            {codeSnippet.map((line, idx) => (
              <div key={idx} className={`code-line ${currentLine === idx ? 'active' : ''}`}>
                <span style={{ color: 'var(--text-dim)', marginRight: 12 }}>{idx + 1}</span>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Interactive Controls</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={stepExecution} disabled={currentLine > 6 && microtasks.length === 0 && macrotasks.length === 0}>
              ▶ Step Execution
            </button>
            <button className="btn btn-secondary" onClick={resetSimulator}>
              ↺ Reset Lab
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
            <strong>Current Phase:</strong> <span style={{ color: 'var(--cyan)' }}>{phase}</span>
          </div>
        </div>

        <TerminalPane logs={logs} title="V8 stdout / libuv Traces" />
      </div>

      {/* Right Column: Visual Queues & Thread Pool */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Runtime Queue Visualization</span>
            <span className="badge badge-emerald">Single Thread V8 + libuv</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
            {/* Call Stack */}
            <div className="lab-card" style={{ background: '#080c18' }}>
              <div className="lab-card-title">
                <span style={{ color: 'var(--indigo)' }}>V8 Call Stack (LIFO)</span>
                <span className="badge">{callStack.length} frame</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 100 }}>
                {callStack.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Stack Empty / Idle]</p> : (
                  callStack.map((f, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.2)', borderLeft: '3px solid var(--indigo)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {f}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Microtasks */}
            <div className="lab-card" style={{ background: '#080c18' }}>
              <div className="lab-card-title">
                <span style={{ color: 'var(--amber)' }}>Microtask Queue (VIP Priority)</span>
                <span className="badge badge-amber">{microtasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 100 }}>
                {microtasks.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Empty]</p> : (
                  microtasks.map((m, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.15)', borderLeft: '3px solid var(--amber)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Macrotasks */}
            <div className="lab-card" style={{ background: '#080c18' }}>
              <div className="lab-card-title">
                <span style={{ color: 'var(--cyan)' }}>Macrotask Queue (Timers / IO)</span>
                <span className="badge">{macrotasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 100 }}>
                {macrotasks.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>[Empty]</p> : (
                  macrotasks.map((m, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(6, 182, 212, 0.15)', borderLeft: '3px solid var(--cyan)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* libuv Worker Threads */}
            <div className="lab-card" style={{ background: '#080c18' }}>
              <div className="lab-card-title">
                <span style={{ color: 'var(--purple)' }}>libuv C++ Worker Pool</span>
                <span className="badge">4 Threads</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 100 }}>
                {libuvThreads.map((t, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: t.includes('Active') ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)', borderLeft: `3px solid ${t.includes('Active') ? 'var(--purple)' : 'var(--text-dim)'}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
