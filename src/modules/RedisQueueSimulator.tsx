import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const RedisQueueSimulator: React.FC = () => {
  const [waitingJobs, setWaitingJobs] = useState<string[]>(['job_101: send_email', 'job_102: resize_image']);
  const [activeJobs, setActiveJobs] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(14);
  const [dlqJobs, setDlqJobs] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'BullMQ worker listening on Redis queue: "default_jobs"' }
  ]);

  const dispatchJob = () => {
    const id = `job_${Date.now().toString().slice(-3)}: process_pdf`;
    setWaitingJobs(p => [...p, id]);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'output', text: `Producer pushed ${id} to Redis stream.` }]);
  };

  const processNext = () => {
    if (waitingJobs.length === 0) return;
    const job = waitingJobs[0];
    setWaitingJobs(waitingJobs.slice(1));
    setActiveJobs([job]);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'system', text: `Worker picked up ${job} [LOCK acquired]` }]);

    setTimeout(() => {
      setActiveJobs([]);
      setCompletedCount(c => c + 1);
      setLogs(p => [...p, { id: (Date.now() + 1).toString(), type: 'success', text: `Finished ${job} successfully. Lock released.` }]);
    }, 600);
  };

  const failJob = () => {
    if (waitingJobs.length === 0) return;
    const job = waitingJobs[0];
    setWaitingJobs(waitingJobs.slice(1));
    setDlqJobs(p => [...p, job]);
    setLogs(p => [...p, { id: Date.now().toString(), type: 'error', text: `Job ${job} exceeded 3 retries! Routed to Dead Letter Queue (DLQ).` }]);
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 7</span>
          <span className="badge">BullMQ / Distributed Systems</span>
        </div>
        <h2 className="sim-title">Redis Background Queues & Workers</h2>
        <p className="sim-desc">
          Offload heavy computational work from the HTTP thread into distributed Redis queues. Observe job states and Dead Letter Queues (DLQ).
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={dispatchJob}>+ Dispatch Job</button>
        <button className="btn btn-secondary" onClick={processNext} disabled={waitingJobs.length === 0}>▶ Process Next Job</button>
        <button className="btn btn-danger" onClick={failJob} disabled={waitingJobs.length === 0}>Simulate Job Failure (DLQ)</button>
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">Waiting Queue ({waitingJobs.length})</div>
          <div className="queue-box">
            {waitingJobs.map((j, i) => <div key={i} className="queue-item">{j}</div>)}
          </div>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">Active Workers ({activeJobs.length})</div>
          <div className="queue-box">
            {activeJobs.map((j, i) => <div key={i} className="queue-item" style={{ borderLeftColor: 'var(--accent-amber)' }}>{j} (Processing...)</div>)}
          </div>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">Dead Letter Queue (DLQ: {dlqJobs.length})</div>
          <div className="queue-box">
            {dlqJobs.map((j, i) => <div key={i} className="queue-item" style={{ borderLeftColor: 'var(--accent-rose)' }}>{j}</div>)}
          </div>
        </div>
      </div>

      <TerminalPane logs={logs} title="Redis Pub/Sub & Worker Event Log" />
    </div>
  );
};
