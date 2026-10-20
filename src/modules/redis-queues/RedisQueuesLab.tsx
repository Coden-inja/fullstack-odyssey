import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const RedisQueuesLab: React.FC = () => {
  const [waiting, setWaiting] = useState<string[]>(['job_101: generate_pdf_report', 'job_102: transcode_video_1080p']);
  const [active, setActive] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>(['job_099: send_welcome_email', 'job_100: index_vector_chunk']);
  const [dlq, setDlq] = useState<string[]>([]);
  const [concurrency, setConcurrency] = useState<number>(2);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'BullMQ: Worker pool subscribed to Redis channel "video-processing".' }
  ]);

  const addJob = () => {
    const id = `job_${Math.floor(100 + Math.random() * 900)}: render_canvas_frame`;
    setWaiting(p => [...p, id]);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: `Producer: Pushed ${id} to Redis stream (XADD).` }]);
  };

  const processNext = () => {
    if (waiting.length === 0) return;
    const job = waiting[0];
    setWaiting(waiting.slice(1));
    setActive(p => [...p, job]);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: `Worker: Acquired lock for ${job}. Processing...` }]);

    setTimeout(() => {
      setActive(p => p.filter(j => j !== job));
      setCompleted(p => [job, ...p]);
      setLogs(p => [...p, { id: Date.now().toString(), type: 'success', text: `Worker: Completed ${job}. Emitted job:completed event.` }]);
    }, 700);
  };

  const failJob = () => {
    if (waiting.length === 0) return;
    const job = waiting[0];
    setWaiting(waiting.slice(1));
    setDlq(p => [...p, job]);
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'error', text: `Worker: Execution of ${job} failed (Out of Memory)!` },
      { id: (Date.now() + 1).toString(), type: 'error', text: `Max 3 retries exceeded. Moved ${job} to Dead Letter Queue (DLQ).` }
    ]);
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">Job Producer & Worker Controls</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={addJob}>+ Add Job (Producer)</button>
            <button className="btn btn-success" onClick={processNext} disabled={waiting.length === 0}>
              ▶ Process Next (Worker)
            </button>
            <button className="btn btn-danger" onClick={failJob} disabled={waiting.length === 0}>
              Simulate Failure (DLQ)
            </button>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Worker Concurrency: {concurrency}</label>
            <input 
              type="range" 
              min={1} 
              max={5} 
              value={concurrency} 
              onChange={(e) => setConcurrency(Number(e.target.value))}
              style={{ width: '100%', marginTop: 6 }} 
            />
          </div>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">BullMQ Queue Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 13 }}>
            <div>Waiting: <strong style={{ color: 'var(--cyan)' }}>{waiting.length}</strong></div>
            <div>Active: <strong style={{ color: 'var(--amber)' }}>{active.length}</strong></div>
            <div>Completed: <strong style={{ color: 'var(--emerald)' }}>{completed.length}</strong></div>
            <div>DLQ (Failed): <strong style={{ color: 'var(--rose)' }}>{dlq.length}</strong></div>
          </div>
        </div>

        <TerminalPane logs={logs} title="Redis Streams Consumer Log" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>BullMQ Distributed Queue Columns</span>
            <span className="badge badge-emerald">Redis 7.2 In-Memory Streams</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {/* Waiting */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--cyan)' }}>Waiting Jobs ({waiting.length})</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {waiting.map((j, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'rgba(6, 182, 212, 0.1)', borderLeft: '3px solid var(--cyan)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {j}
                  </div>
                ))}
              </div>
            </div>

            {/* Active */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--amber)' }}>Active Workers ({active.length})</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {active.map((j, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid var(--amber)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {j}
                  </div>
                ))}
              </div>
            </div>

            {/* DLQ */}
            <div className="lab-card" style={{ background: '#040711' }}>
              <strong style={{ fontSize: 13, color: 'var(--rose)' }}>Dead Letter Queue ({dlq.length})</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {dlq.map((j, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'rgba(244, 63, 94, 0.1)', borderLeft: '3px solid var(--rose)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {j}
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
