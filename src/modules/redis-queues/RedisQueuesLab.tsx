import React, { useState, useEffect } from 'react';

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

    // Simulate worker processing
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

    // Step 1: Active
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === brokenJob.id ? { ...j, status: 'active', attempts: 1 } : j));

      // Step 2: Failed attempt 1
      setTimeout(() => {
        setJobs(prev => prev.map(j => j.id === brokenJob.id ? { ...j, status: 'failed', attempts: 2 } : j));

        // Step 3: Failed attempt 2 & move to DLQ
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

  const waitingJobs = jobs.filter(j => j.status === 'waiting');
  const activeJobs = jobs.filter(j => j.status === 'active');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const dlqJobs = jobs.filter(j => j.status === 'dlq' || j.status === 'failed');

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {REDIS_LEVELS.map((lvl, idx) => (
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

          {/* Concurrency Selector for Level 2 */}
          {currentLevel.id === 2 && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Worker Concurrency:</span>
              <button
                className={`btn btn-sm ${concurrency === 1 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setConcurrency(1)}
              >
                1 Worker
              </button>
              <button
                className={`btn btn-sm ${concurrency === 4 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setConcurrency(4)}
              >
                4 Workers (Parallel)
              </button>
            </div>
          )}

          <div className="lesson-actions">
            {currentLevel.id !== 3 ? (
              <button className="btn btn-primary btn-sm" onClick={() => enqueueNormalJobs(currentLevel.id === 2 ? 4 : 3)}>
                Enqueue Jobs →
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={enqueuePoisonPill} style={{ background: '#dc2626' }}>
                Enqueue Poison Pill (Corrupt Task) →
              </button>
            )}
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered background queue state machines and DLQs.</div>
            </div>
            {levelIdx < REDIS_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Redis Queue State Machine Visualizer */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">Redis BullMQ Queue State Machine</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Watch jobs transition from Waiting to Active, and complete or quarantine to the Dead Letter Queue.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-indigo">Concurrency: {concurrency}</span>
            <span className="badge">Total Jobs: {jobs.length}</span>
          </div>
        </div>

        {/* 4 State Buckets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1 }}>
          {/* Waiting */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Waiting</span>
              <span className="badge">{waitingJobs.length}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {waitingJobs.map(j => (
                <div key={j.id} style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '8px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                  {j.name}
                </div>
              ))}
            </div>
          </div>

          {/* Active */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#d97706', display: 'flex', justifyContent: 'space-between' }}>
              <span>Active (Processing)</span>
              <span className="badge badge-warning">{activeJobs.length}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {activeJobs.map(j => (
                <div key={j.id} style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', padding: '8px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#92400e' }}>
                  {j.name}
                </div>
              ))}
            </div>
          </div>

          {/* Completed */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--success)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Completed</span>
              <span className="badge badge-success">{completedJobs.length}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {completedJobs.map(j => (
                <div key={j.id} style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '8px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: 'var(--success)' }}>
                  ✓ {j.name}
                </div>
              ))}
            </div>
          </div>

          {/* Dead Letter Queue (DLQ) */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
              <span>Dead Letter Queue (DLQ)</span>
              <span className="badge badge-danger">{dlqJobs.length}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {dlqJobs.map(j => (
                <div key={j.id} style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '8px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#b91c1c' }}>
                  ✕ {j.name} (Max Retries Reached)
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
