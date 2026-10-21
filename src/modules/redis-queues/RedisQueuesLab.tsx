import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

interface QueueJob {
  id: string;
  name: string;
  priority: 'CRITICAL' | 'NORMAL';
  attempts: number;
  maxAttempts: number;
  payload: Record<string, any>;
  state: 'waiting' | 'active' | 'retrying' | 'completed' | 'failed_dlq';
  error?: string;
  workerId?: number;
}

export const RedisQueuesLab: React.FC = () => {
  const [jobs, setJobs] = useState<QueueJob[]>([
    {
      id: 'job_4891',
      name: 'stripe.charge_card',
      priority: 'CRITICAL',
      attempts: 0,
      maxAttempts: 3,
      payload: { customer: 'cus_99', amount: '$499.00' },
      state: 'waiting'
    },
    {
      id: 'job_4892',
      name: 'video.transcode_1080p',
      priority: 'NORMAL',
      attempts: 0,
      maxAttempts: 3,
      payload: { s3_key: 'uploads/demo.mov', codec: 'h264' },
      state: 'waiting'
    },
    {
      id: 'job_4893',
      name: 'email.dispatch_welcome',
      priority: 'NORMAL',
      attempts: 0,
      maxAttempts: 3,
      payload: { to: 'alex@enterprise.com' },
      state: 'waiting'
    }
  ]);

  const [workerCount, setWorkerCount] = useState<number>(3);
  const [isProcessingLoop, setIsProcessingLoop] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenge tracking
  const [achievedConcurrency, setAchievedConcurrency] = useState<boolean>(false);
  const [achievedDlqQuarantine, setAchievedDlqQuarantine] = useState<boolean>(false);
  const [achievedRedrive, setAchievedRedrive] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'BullMQ 5.8 / Redis 7.2 cluster online. Streams group "enterprise-workers" established.' },
    { id: '2', type: 'output', text: 'Ready to produce jobs, dispatch workers, and simulate network partitions.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('redis-queues')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const addJob = (priority: 'CRITICAL' | 'NORMAL', isPoisonPill = false) => {
    const id = `job_${Math.floor(1000 + Math.random() * 9000)}`;
    const name = isPoisonPill ? 'malformed.corrupt_chunk' : priority === 'CRITICAL' ? 'order.finalize_invoice' : 'cdn.purge_cache';
    const newJob: QueueJob = {
      id,
      name,
      priority,
      attempts: 0,
      maxAttempts: 3,
      payload: { ts: Date.now(), poison: isPoisonPill },
      state: 'waiting'
    };

    setJobs(p => [newJob, ...p]);
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'system', text: `Producer: XADD stream:orders ${priority === 'CRITICAL' ? 'MAXLEN ~ 1000' : ''} ${id} [${name}]` }
    ]);
  };

  const processNextJob = () => {
    const nextWaiting = jobs.find(j => j.state === 'waiting' || j.state === 'retrying');
    if (!nextWaiting) return;

    const assignedWorker = Math.floor(Math.random() * workerCount) + 1;
    const isPoison = nextWaiting.payload.poison;

    // Transition to Active
    setJobs(prev => prev.map(j => j.id === nextWaiting.id ? { ...j, state: 'active', workerId: assignedWorker } : j));
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'output', text: `Worker #${assignedWorker}: XREADGROUP acquired Redlock on ${nextWaiting.id} (${nextWaiting.name})` }
    ]);

    setTimeout(() => {
      if (isPoison) {
        // Trigger retry or DLQ
        const nextAttempts = nextWaiting.attempts + 1;
        if (nextAttempts >= nextWaiting.maxAttempts) {
          setJobs(prev => prev.map(j => j.id === nextWaiting.id ? { ...j, state: 'failed_dlq', attempts: nextAttempts, error: 'OOM_KILL_SIGSEGV' } : j));
          setAchievedDlqQuarantine(true);
          setLogs(p => [
            ...p,
            { id: Date.now().toString(), type: 'error', text: `Worker #${assignedWorker}: Crash processing ${nextWaiting.id}! Attempts: ${nextAttempts}/${nextWaiting.maxAttempts}.` },
            { id: (Date.now() + 1).toString(), type: 'error', text: `🚨 QUARANTINE: Max attempts exhausted. Moved ${nextWaiting.id} to Dead Letter Queue (DLQ).` }
          ]);
        } else {
          setJobs(prev => prev.map(j => j.id === nextWaiting.id ? { ...j, state: 'retrying', attempts: nextAttempts, error: `Transient network failure` } : j));
          setLogs(p => [
            ...p,
            { id: Date.now().toString(), type: 'error', text: `Worker #${assignedWorker}: ${nextWaiting.id} failed! Retrying in 2^${nextAttempts}s backoff.` }
          ]);
        }
      } else {
        // Successful completion
        setJobs(prev => prev.map(j => j.id === nextWaiting.id ? { ...j, state: 'completed', attempts: j.attempts + 1 } : j));
        setAchievedConcurrency(true);
        setLogs(p => [
          ...p,
          { id: Date.now().toString(), type: 'success', text: `Worker #${assignedWorker}: Completed ${nextWaiting.id}! XACK stream:orders consumer_group -> OK.` }
        ]);
      }
    }, 600);
  };

  const redriveDlq = () => {
    setJobs(prev => prev.map(j => j.state === 'failed_dlq' ? { ...j, state: 'waiting', attempts: 0, payload: { ...j.payload, poison: false } } : j));
    setAchievedRedrive(true);
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'system', text: `DLQ Replay: Sanitized and re-injected all quarantined jobs back to waiting stream!` }
    ]);
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('redis-queues')) {
        list.push('redis-queues');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 07 (Redis Queues & Background Workers) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  const waitingJobs = jobs.filter(j => j.state === 'waiting' || j.state === 'retrying');
  const activeJobs = jobs.filter(j => j.state === 'active');
  const completedJobs = jobs.filter(j => j.state === 'completed');
  const dlqJobs = jobs.filter(j => j.state === 'failed_dlq');

  return (
    <>
      <div className="lab-panel-left">
        {/* Story Quest */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Poison Pill & Dead Letter Queue</span>
            <span className="badge badge-indigo">Module 07</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            In distributed systems, background tasks must never crash worker fleets in an infinite loop.
            A <strong>Dead Letter Queue (DLQ)</strong> isolates corrupted tasks after exponential backoff retries fail.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            <strong>Redlock Invariant:</strong> Workers lease jobs via atomic Redis primitives (<code>XREADGROUP / BRPOPLPUSH</code>)
            with a heartbeat TTL watchdog. If a worker dies, peer workers reclaim the lease.
          </p>
        </div>

        {/* Producer & Worker Controls */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>BullMQ Pipeline Dispatcher</span>
            <span className="badge badge-emerald">{workerCount} Active Workers</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => addJob('NORMAL')}>
                + Produce Job (Normal)
              </button>
              <button className="btn btn-secondary" onClick={() => addJob('CRITICAL')}>
                + Produce Job (VIP)
              </button>
            </div>

            <button
              className="btn btn-danger"
              onClick={() => addJob('CRITICAL', true)}
              style={{ justifyContent: 'center' }}
            >
              ⚠️ Inject Poison Pill Job (Simulate Crash)
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-success"
                onClick={processNextJob}
                disabled={waitingJobs.length === 0}
                style={{ justifyContent: 'center' }}
              >
                ▶ Worker Step Next
              </button>

              <button
                className="btn btn-secondary"
                onClick={redriveDlq}
                disabled={dlqJobs.length === 0}
                style={{ justifyContent: 'center' }}
              >
                ↺ Replay DLQ ({dlqJobs.length})
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Worker Fleet Concurrency: {workerCount} Pods</label>
            <input
              type="range"
              min={1}
              max={5}
              value={workerCount}
              onChange={(e) => setWorkerCount(parseInt(e.target.value, 10))}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Distributed Queue Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedConcurrency ? '✅' : '⏳'}</span>
              <span>Lease and successfully acknowledge (XACK) a background job</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedDlqQuarantine ? '✅' : '⏳'}</span>
              <span>Quarantine a poison pill into Dead Letter Queue after max retries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedRedrive ? '✅' : '⏳'}</span>
              <span>Replay dead-lettered jobs back into waiting queue</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedConcurrency && achievedDlqQuarantine ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedConcurrency || !achievedDlqQuarantine}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 07 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="Redis Consumer Group Event Stream" />
      </div>

      {/* Right Column: 4-Column Queue State Canvas */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>BullMQ / Redis State Machine Canvas</span>
            <span className="badge badge-emerald">Redis In-Memory Hash/Stream</span>
          </div>

          {/* 4-State Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {/* 1. Waiting */}
            <div className="lab-card" style={{ background: '#040711', minHeight: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 12, color: 'var(--cyan)' }}>Waiting ({waitingJobs.length})</strong>
                <span className="badge">Pending</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {waitingJobs.map(j => (
                  <div key={j.id} style={{ padding: '8px 10px', background: 'rgba(6, 182, 212, 0.1)', borderLeft: '3px solid var(--cyan)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{j.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{j.id} • {j.priority}</div>
                    {j.state === 'retrying' && (
                      <span className="badge badge-amber" style={{ fontSize: 9, marginTop: 4 }}>
                        Retrying #{j.attempts}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Active */}
            <div className="lab-card" style={{ background: '#040711', minHeight: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 12, color: 'var(--amber)' }}>Active ({activeJobs.length})</strong>
                <span className="badge badge-amber">Locked</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeJobs.map(j => (
                  <div key={j.id} style={{ padding: '8px 10px', background: 'rgba(245, 158, 11, 0.15)', borderLeft: '3px solid var(--amber)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{j.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>Worker #{j.workerId} (Leased)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Completed */}
            <div className="lab-card" style={{ background: '#040711', minHeight: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 12, color: 'var(--emerald)' }}>Completed ({completedJobs.length})</strong>
                <span className="badge badge-emerald">XACK</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {completedJobs.slice(0, 5).map(j => (
                  <div key={j.id} style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid var(--emerald)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: '#fff' }}>{j.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{j.id} • ✓ Acked</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Dead Letter Queue */}
            <div className="lab-card" style={{ background: '#040711', minHeight: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 12, color: 'var(--rose)' }}>DLQ ({dlqJobs.length})</strong>
                <span className="badge badge-rose">Poison</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dlqJobs.map(j => (
                  <div key={j.id} style={{ padding: '8px 10px', background: 'rgba(244, 63, 94, 0.15)', borderLeft: '3px solid var(--rose)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--rose)' }}>{j.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{j.error}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>Attempts: {j.attempts}/{j.maxAttempts}</div>
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
