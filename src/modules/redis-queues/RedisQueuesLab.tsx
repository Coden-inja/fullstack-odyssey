import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface QueueJob {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'dlq';
  attempts: number;
  maxAttempts: number;
  isPoisonPill?: boolean;
}

interface RedisQueueLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  targetState: string;
}

const REDIS_LEVELS: RedisQueueLevel[] = [
  {
    id: 1,
    title: 'Level 1: Offloading Slow Work',
    subtitle: 'Why Web Servers Use Queues',
    story: 'Sending a confirmation email or generating a receipt PDF takes 3 seconds. If your web server waits for that to finish, users are stuck staring at a frozen browser.',
    concept: 'Instead of doing the slow work on the web thread, the server puts a job into a Redis Queue and responds to the user instantly! A background worker pulls the job and finishes it asynchronously.',
    goalDescription: 'Click "Enqueue Welcome Emails" and watch Worker 1 and Worker 2 pull jobs from Waiting to Completed.',
    hint: 'Click "Enqueue Welcome Emails" to start processing.',
    targetState: 'completed_all'
  },
  {
    id: 2,
    title: 'Level 2: Scaling Concurrency',
    subtitle: 'Processing Multiple Tasks in Parallel',
    story: 'Your newsletter campaign is launching and 8 emails need to go out immediately. With only 1 worker, they finish one by one.',
    concept: 'Worker concurrency allows multiple tasks to be processed at the exact same moment. Setting concurrency to 4 allows 4 background jobs to run simultaneously.',
    goalDescription: 'Set Worker Concurrency to 4 and click "Process Batch" to watch 4 jobs process in parallel.',
    hint: 'Set concurrency to 4 and process the batch.',
    targetState: 'parallel_4'
  },
  {
    id: 3,
    title: 'Level 3: The Dead Letter Queue (DLQ)',
    subtitle: 'Stopping Poison Pills from Freezing Workers',
    story: 'What happens if a job has a corrupt payload that always crashes the worker? If the worker keeps retrying forever in an infinite loop, no other work gets done.',
    concept: 'A Dead Letter Queue (DLQ) is a safety quarantine. If a job fails 3 times, the queue acknowledges it and moves it into the DLQ so developers can inspect the error while normal jobs keep flowing.',
    goalDescription: 'Enqueue a Broken Job (Poison Pill), watch it fail its 3 retry attempts, and see it quarantined in the DLQ.',
    hint: 'Click "Enqueue Poison Pill" and watch it move to the DLQ after 3 failed attempts.',
    targetState: 'dlq_quarantine'
  }
];

export const RedisQueuesLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = REDIS_LEVELS[levelIdx];

  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [concurrency, setConcurrency] = useState<number>(2);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon) {
      if (currentLevel.id === 1 && jobs.length >= 3 && jobs.every(j => j.status === 'completed')) {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 2 && concurrency === 4 && jobs.filter(j => j.status === 'completed').length >= 4) {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 3 && jobs.some(j => j.status === 'dlq')) {
        setLevelWon(true);
        saveModuleCompletion();
      }
    }
  }, [jobs, concurrency, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('redis-queues')) {
        list.push('redis-queues');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    setJobs([]);
    setConcurrency(idx === 1 ? 4 : 2);
    setShowHint(false);
    setLevelWon(false);
  };

  const enqueueNormalJobs = (count = 3) => {
    const newJobs: QueueJob[] = [];
    for (let i = 1; i <= count; i++) {
      newJobs.push({
        id: `job_${Date.now()}_${i}`,
        name: `Send welcome email to user_${i}@example.com`,
        status: 'waiting',
        attempts: 0,
        maxAttempts: 3
      });
    }
    setJobs(prev => [...prev, ...newJobs]);

    setTimeout(() => {
      setJobs(prev => prev.map(j => (j.status === 'waiting' ? { ...j, status: 'active' } : j)));
      setTimeout(() => {
        setJobs(prev => prev.map(j => (j.status === 'active' ? { ...j, status: 'completed' } : j)));
      }, 800);
    }, 400);
  };

  const enqueuePoisonPill = () => {
    const brokenJob: QueueJob = {
      id: `job_poison_${Date.now()}`,
      name: `Process corrupt payload #404 (Uncaught Exception)`,
      status: 'waiting',
      attempts: 0,
      maxAttempts: 3,
      isPoisonPill: true
    };
    setJobs(prev => [...prev, brokenJob]);

    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === brokenJob.id ? { ...j, status: 'active', attempts: 1 } : j));
      setTimeout(() => {
        setJobs(prev => prev.map(j => j.id === brokenJob.id ? { ...j, status: 'failed', attempts: 2 } : j));
        setTimeout(() => {
          setJobs(prev => prev.map(j => j.id === brokenJob.id ? { ...j, status: 'dlq', attempts: 3 } : j));
        }, 800);
      }, 800);
    }, 400);
  };

  const autoPlaySolution = () => {
    resetLevel(levelIdx);
    setTimeout(() => {
      if (currentLevel.id === 1) enqueueNormalJobs(3);
      if (currentLevel.id === 2) {
        setConcurrency(4);
        enqueueNormalJobs(4);
      }
      if (currentLevel.id === 3) enqueuePoisonPill();
    }, 200);
  };

  return (
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Visual BullMQ Pipeline & Companion Queue Controls */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live Queue Pipeline Visualizer */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  BullMQ Distributed Redis Queue
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Asynchronous worker pipeline: Waiting → Active → Completed / Dead Letter Queue.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-indigo">{concurrency} Worker Threads</span>
                <span className="badge">{jobs.length} Jobs Total</span>
              </div>
            </div>

            {/* Queue Stages 4-Box Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: '#2563eb', marginBottom: 4 }}>
                  Waiting ({jobs.filter(j => j.status === 'waiting').length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 70, maxHeight: 90, overflowY: 'auto' }}>
                  {jobs.filter(j => j.status === 'waiting').map(j => (
                    <div key={j.id} style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: 4, fontSize: 10.5 }}>
                      {j.name.slice(0, 24)}...
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: '#d97706', marginBottom: 4 }}>
                  Active ({jobs.filter(j => j.status === 'active').length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 70, maxHeight: 90, overflowY: 'auto' }}>
                  {jobs.filter(j => j.status === 'active').map(j => (
                    <div key={j.id} style={{ background: '#fef3c7', padding: '4px 6px', borderRadius: 4, fontSize: 10.5, color: '#92400e', fontWeight: 600 }}>
                      ⚡ {j.name.slice(0, 22)}...
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: '#059669', marginBottom: 4 }}>
                  Completed ({jobs.filter(j => j.status === 'completed').length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 70, maxHeight: 90, overflowY: 'auto' }}>
                  {jobs.filter(j => j.status === 'completed').map(j => (
                    <div key={j.id} style={{ background: '#ecfdf5', padding: '4px 6px', borderRadius: 4, fontSize: 10.5, color: '#065f46' }}>
                      ✓ {j.name.slice(0, 22)}...
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: '#dc2626', marginBottom: 4 }}>
                  Dead Letter ({jobs.filter(j => j.status === 'dlq' || j.status === 'failed').length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 70, maxHeight: 90, overflowY: 'auto' }}>
                  {jobs.filter(j => j.status === 'dlq' || j.status === 'failed').map(j => (
                    <div key={j.id} style={{ background: '#fee2e2', padding: '4px 6px', borderRadius: 4, fontSize: 10.5, color: '#991b1b', fontWeight: 700 }}>
                      ☠ {j.name.slice(0, 20)}... ({j.attempts}/3)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact Redis Terminal & Enqueue Actions */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {REDIS_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  className={`btn btn-sm ${levelIdx === idx ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLevelIdx(idx)}
                  style={{ borderRadius: 9999, padding: '3px 9px', fontSize: 11 }}
                >
                  Level {lvl.id}
                </button>
              ))}
            </div>

            {/* Bullets & Goal Box */}
            <div className="level-bullets-box">
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {currentLevel.subtitle}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>
                {currentLevel.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {currentLevel.goalDescription}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {currentLevel.id === 1 && (
                  <button className="btn btn-primary btn-sm" onClick={() => enqueueNormalJobs(3)} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Enqueue Welcome Emails
                  </button>
                )}
                {currentLevel.id === 2 && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConcurrency(4)} style={{ fontSize: 11, padding: '4px 8px' }}>
                      Concurrency = 4
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => enqueueNormalJobs(4)} style={{ fontSize: 11, padding: '4px 10px' }}>
                      Process Batch
                    </button>
                  </>
                )}
                {currentLevel.id === 3 && (
                  <button className="btn btn-primary btn-sm" onClick={enqueuePoisonPill} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Enqueue Poison Pill
                  </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => setShowHint(!showHint)} style={{ fontSize: 11, padding: '4px 8px' }}>
                  {showHint ? 'Hide Hint' : 'Hint'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={autoPlaySolution} style={{ fontSize: 11, padding: '4px 8px' }}>
                  Auto-Play
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => resetLevel(levelIdx)} style={{ fontSize: 11, padding: '4px 8px' }}>
                  Reset
                </button>
              </div>

              {showHint && (
                <div style={{ marginTop: 4, padding: '6px 8px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 11.5, color: '#92400e' }}>
                  <strong>Hint: </strong>{currentLevel.hint}
                </div>
              )}
            </div>

            {/* Compact Authentic macOS Redis Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  REDIS-CLI MONITOR — BULLMQ ENGINE
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {jobs.length === 0 ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    {'redis-cli> MONITOR waiting for LPUSH / BRPOPLPUSH events...'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="terminal-line" style={{ color: '#38bdf8' }}>
                      <span className="glyph">→</span>
                      <span>LPUSH bull:mailQueue:waiting (Total: {jobs.length})</span>
                    </div>
                    {jobs.some(j => j.status === 'completed') && (
                      <div className="terminal-line" style={{ color: '#4ade80' }}>
                        <span className="glyph">✓</span>
                        <span>{'HDEL bull:mailQueue:active -> ACK Job Completed'}</span>
                      </div>
                    )}
                    {jobs.some(j => j.status === 'dlq') && (
                      <div className="terminal-line" style={{ color: '#f87171' }}>
                        <span className="glyph">✗</span>
                        <span>{'ZADD bull:mailQueue:failed (3/3 retries exceeded -> DLQ)'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Level Completion Status */}
            {levelWon && (
              <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 12 }}>Level Completed!</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered distributed task queue orchestration.</div>
                </div>
                {levelIdx < REDIS_LEVELS.length - 1 ? (
                  <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Next Level →
                  </button>
                ) : (
                  <span className="badge badge-success">Mastered!</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Scroll for Deep Architectural Mechanics & Incident Story */}
      <div className="lab-lesson-bottom">
        {/* Left Card: Distributed Queue Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            Distributed Systems Pattern
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            Redis In-Memory Queues &amp; Atomic Pop
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Atomic Work Stealing (BRPOPLPUSH):</div>
            <div>Redis Lua script moves job from 'waiting' list to 'active' list atomically.</div>
            <div>If the worker process crashes midway, the job remains in 'active' and is recovered by a supervisor stall-checker.</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The Infinite Retry Storm
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> Failing background jobs must ALWAYS have an exponential backoff cap and maximum retry limit. Retrying without backoff causes millions of worker tasks to hammer third-party APIs during an outage, causing permanent IP bans.
          </div>
        </div>
      </div>
    </div>
  );
};
