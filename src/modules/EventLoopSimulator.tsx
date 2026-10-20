import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const EventLoopSimulator: React.FC = () => {
  const [callStack, setCallStack] = useState<string[]>(['main()']);
  const [microtasks, setMicrotasks] = useState<string[]>(['Promise.then() (resolved)', 'process.nextTick() (urgent)']);
  const [macrotasks, setMacrotasks] = useState<string[]>(['setTimeout(cb, 0)', 'setImmediate(worker)']);
  const [libuvPool, setLibuvPool] = useState<string[]>(['crypto.pbkdf2() [Thread 1]', 'fs.readFile() [Thread 2]']);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Node.js v22 libuv engine initialized.' },
    { id: '2', type: 'output', text: 'Call Stack executing synchronous baseline code.' }
  ]);

  const stepDrain = () => {
    if (callStack.length > 0) {
      const top = callStack[callStack.length - 1];
      setCallStack(callStack.slice(0, -1));
      setLogs(prev => [...prev, { id: Date.now().toString(), type: 'success', text: `Call Stack: Finished ${top}` }]);
      return;
    }

    if (microtasks.length > 0) {
      const next = microtasks[0];
      setMicrotasks(microtasks.slice(1));
      setCallStack([next]);
      setLogs(prev => [...prev, { id: Date.now().toString(), type: 'output', text: `Microtask Queue Priority: Popped ${next} onto Call Stack` }]);
      return;
    }

    if (macrotasks.length > 0) {
      const next = macrotasks[0];
      setMacrotasks(macrotasks.slice(1));
      setCallStack([next]);
      setLogs(prev => [...prev, { id: Date.now().toString(), type: 'output', text: `Macrotask Event Loop Tick: Scheduled ${next} to Call Stack` }]);
      return;
    }

    if (libuvPool.length > 0) {
      const finished = libuvPool[0];
      setLibuvPool(libuvPool.slice(1));
      setMicrotasks(prev => [...prev, `Callback for ${finished.split(' ')[0]}`]);
      setLogs(prev => [...prev, { id: Date.now().toString(), type: 'system', text: `libuv Threadpool: ${finished} completed IO, queued callback to Microtasks` }]);
      return;
    }

    setLogs(prev => [...prev, { id: Date.now().toString(), type: 'system', text: 'Event Loop Idle: All queues drained. Waiting for new IO events.' }]);
  };

  const resetAll = () => {
    setCallStack(['main()']);
    setMicrotasks(['Promise.then() (resolved)', 'process.nextTick() (urgent)']);
    setMacrotasks(['setTimeout(cb, 0)', 'setImmediate(worker)']);
    setLibuvPool(['crypto.pbkdf2() [Thread 1]', 'fs.readFile() [Thread 2]']);
    setLogs([{ id: Date.now().toString(), type: 'system', text: 'Reset simulator to initial task distribution.' }]);
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 1</span>
          <span className="badge">Concurrency & libuv</span>
        </div>
        <h2 className="sim-title">Node.js Event Loop & Thread Pool Mechanics</h2>
        <p className="sim-desc">
          JavaScript is single-threaded, but Node.js achieves high throughput via libuv. 
          Microtasks drain completely before the next Macrotask tick. Heavy IO is offloaded to the C++ worker pool.
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={stepDrain}>▶ Step Loop Tick</button>
        <button className="btn btn-secondary" onClick={() => setMicrotasks(p => [...p, `Promise.resolve(#${p.length + 1})`])}>+ Queue Microtask</button>
        <button className="btn btn-secondary" onClick={() => setMacrotasks(p => [...p, `setTimeout(#${p.length + 1})`])}>+ Queue Macrotask</button>
        <button className="btn btn-secondary" onClick={() => setLibuvPool(p => [...p, `fs.stat(#${p.length + 1})`])}>+ libuv Worker IO</button>
        <button className="btn btn-danger" onClick={resetAll}>Reset</button>
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">
            <span>Call Stack (V8 Single Thread)</span>
            <span style={{ color: 'var(--accent-indigo)' }}>{callStack.length} active</span>
          </div>
          <div className="queue-box">
            {callStack.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>[Empty / Idle]</p> : (
              callStack.map((item, idx) => (
                <div key={idx} className="queue-item" style={{ borderLeftColor: 'var(--accent-indigo)' }}>
                  <span>{item}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>LIFO</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">
            <span>Microtask Queue (Higher Priority)</span>
            <span style={{ color: 'var(--accent-amber)' }}>{microtasks.length} pending</span>
          </div>
          <div className="queue-box">
            {microtasks.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>[Empty]</p> : (
              microtasks.map((item, idx) => (
                <div key={idx} className="queue-item microtask">
                  <span>{item}</span>
                  <span style={{ fontSize: 10, color: 'var(--accent-amber)' }}>VIP</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">
            <span>Macrotask Queue (Timers / IO)</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{macrotasks.length} pending</span>
          </div>
          <div className="queue-box">
            {macrotasks.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>[Empty]</p> : (
              macrotasks.map((item, idx) => (
                <div key={idx} className="queue-item macrotask">
                  <span>{item}</span>
                  <span style={{ fontSize: 10, color: 'var(--accent-cyan)' }}>FIFO</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">
            <span>libuv C++ Worker Thread Pool</span>
            <span style={{ color: 'var(--accent-purple)' }}>{libuvPool.length} threads</span>
          </div>
          <div className="queue-box">
            {libuvPool.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>[Idle]</p> : (
              libuvPool.map((item, idx) => (
                <div key={idx} className="queue-item libuv">
                  <span>{item}</span>
                  <span style={{ fontSize: 10, color: 'var(--accent-purple)' }}>Async POSIX</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <TerminalPane logs={logs} title="V8 / libuv Runtime Traces" />
    </div>
  );
};
