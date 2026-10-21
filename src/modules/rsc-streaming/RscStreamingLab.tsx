import React, { useState, useEffect } from 'react';

interface RscLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  targetState: string;
}

const RSC_LEVELS: RscLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Instant Shell',
    subtitle: 'Sending HTML Before Data is Ready',
    story: 'In traditional web apps, if a database query takes 800ms, the user sees a blank white screen for 800ms before anything paints.',
    concept: 'With Streaming SSR, the server sends Chunk 0 (the static header, navigation, and loading skeleton) in 15ms! The user sees a complete layout immediately while slow data loads in the background.',
    goalDescription: 'Click "Stream Initial Shell (Chunk 0)" to see the page layout paint in 15ms with loading skeletons.',
    hint: 'Click "Stream Initial Shell (Chunk 0)" to start the stream.',
    targetState: 'shell_streamed'
  },
  {
    id: 2,
    title: 'Level 2: Streaming Data Chunks',
    subtitle: 'How React Flight Protocol Replaces Skeletons',
    story: 'How does the server send the database data when it finishes without making the browser reload the page?',
    concept: 'The server leaves the HTTP connection open. When the query completes, it streams Chunk 1 containing React Flight data. The browser swaps the skeleton with the real component without a reload.',
    goalDescription: 'Click "Stream Data Payload (Chunk 1)" and watch the loading skeleton seamlessly transform into real content.',
    hint: 'Click "Stream Data Payload" to finish streaming.',
    targetState: 'data_streamed'
  },
  {
    id: 3,
    title: 'Level 3: Early Interaction (Selective Hydration)',
    subtitle: 'Clicking Buttons Before JS Finishes Loading',
    story: 'What happens if an impatient user clicks a button before the JavaScript bundle has finished downloading?',
    concept: 'React 18 selective hydration captures the user’s click in an event queue. As soon as the component hydrates, React replays the click so no input is ever lost.',
    goalDescription: 'Click the "Like" button while it is unhydrated, watch the click get queued, and see it replay automatically upon hydration.',
    hint: 'Click the "Like" button on the unhydrated card, then click "Hydrate Island".',
    targetState: 'replayed'
  }
];

export const RscStreamingLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = RSC_LEVELS[levelIdx];

  const [streamStage, setStreamStage] = useState<'idle' | 'shell' | 'data'>('idle');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [queuedClicks, setQueuedClicks] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(42);
  const [wireChunks, setWireChunks] = useState<string[]>([]);

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon) {
      if (currentLevel.id === 1 && streamStage === 'shell') {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 2 && streamStage === 'data') {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 3 && isHydrated && likeCount > 42) {
        setLevelWon(true);
        saveModuleCompletion();
      }
    }
  }, [streamStage, isHydrated, likeCount, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('rsc-streaming')) {
        list.push('rsc-streaming');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    setStreamStage('idle');
    setIsHydrated(false);
    setQueuedClicks(0);
    setLikeCount(42);
    setWireChunks([]);
    setShowHint(false);
    setLevelWon(false);
  };

  const streamShell = () => {
    setStreamStage('shell');
    setWireChunks([
      'HTTP/2 200 OK (Transfer-Encoding: chunked)',
      'Chunk 0 (15ms): <!DOCTYPE html><html><head>...</head><body><nav>My App</nav><div id="skeleton">Loading...</div>'
    ]);
  };

  const streamData = () => {
    setStreamStage('data');
    setWireChunks(prev => [
      ...prev,
      'Chunk 1 (320ms): React Flight Data: 0:["$","div",null,{"children":"Real Data: 12 New Orders"}]'
    ]);
  };

  const handleLikeClick = () => {
    if (!isHydrated) {
      setQueuedClicks(prev => prev + 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
  };

  const triggerHydration = () => {
    setIsHydrated(true);
    // Replay queued clicks
    if (queuedClicks > 0) {
      setLikeCount(prev => prev + queuedClicks);
      setQueuedClicks(0);
    }
  };

  const autoPlaySolution = () => {
    resetLevel(levelIdx);
    setTimeout(() => {
      if (currentLevel.id === 1) streamShell();
      if (currentLevel.id === 2) {
        streamShell();
        setTimeout(() => streamData(), 500);
      }
      if (currentLevel.id === 3) {
        streamShell();
        streamData();
        handleLikeClick();
        setTimeout(() => triggerHydration(), 600);
      }
    }, 200);
  };

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RSC_LEVELS.map((lvl, idx) => (
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
            {currentLevel.id === 1 && (
              <button className="btn btn-primary btn-sm" onClick={streamShell}>
                Stream Initial Shell (Chunk 0) →
              </button>
            )}
            {currentLevel.id === 2 && (
              <>
                <button className="btn btn-outline btn-sm" onClick={streamShell} disabled={streamStage !== 'idle'}>
                  1. Stream Shell
                </button>
                <button className="btn btn-primary btn-sm" onClick={streamData} disabled={streamStage === 'data'}>
                  2. Stream Data Payload (Chunk 1) →
                </button>
              </>
            )}
            {currentLevel.id === 3 && (
              <>
                <button className="btn btn-outline btn-sm" onClick={streamShell} disabled={streamStage !== 'idle'}>
                  1. Prepare Shell
                </button>
                <button className="btn btn-primary btn-sm" onClick={triggerHydration}>
                  Hydrate Island (Replay Clicks) →
                </button>
              </>
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered HTTP chunked streaming and hydration.</div>
            </div>
            {levelIdx < RSC_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Browser Render & Chunk Inspector */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">Browser Render & HTTP/2 Stream Wire</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Watch the page paint immediately and hydrate interactive islands.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge ${streamStage !== 'idle' ? 'badge-success' : ''}`}>
              Shell: {streamStage !== 'idle' ? 'Painted (15ms)' : 'Waiting'}
            </span>
            <span className={`badge ${isHydrated ? 'badge-indigo' : ''}`}>
              Hydration: {isHydrated ? 'Active' : 'Pending JS'}
            </span>
          </div>
        </div>

        {/* Browser Mockup Window */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden', background: '#ffffff', marginBottom: 16 }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#cbd5e1' }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#cbd5e1' }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#cbd5e1' }} />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>https://app.example.com/dashboard</span>
          </div>

          <div style={{ padding: 20 }}>
            {streamStage === 'idle' ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
                Browser waiting for HTTP response...
              </div>
            ) : (
              <div>
                {/* Static Navbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Acme Store</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Logged in as Alex</span>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Static Component */}
                  <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 6, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Static Header</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Painted instantly in Chunk 0 (0ms delay).</div>
                  </div>

                  {/* Suspended Dynamic Component */}
                  <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 6, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      Dynamic Order Feed (Suspense)
                    </div>
                    {streamStage === 'shell' ? (
                      <div style={{ padding: '10px 0', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 12 }}>
                        Loading orders from database... (Skeleton)
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginBottom: 8 }}>
                          12 Recent Orders Loaded via Flight Protocol!
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            className={`btn btn-sm ${isHydrated ? 'btn-primary' : 'btn-outline'}`}
                            onClick={handleLikeClick}
                          >
                            Like ({likeCount})
                          </button>
                          {queuedClicks > 0 && (
                            <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>
                              {queuedClicks} click(s) queued for hydration replay!
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HTTP/2 Chunked Stream Wire Frame */}
        <div style={{ flex: 1, background: '#0f172a', padding: 14, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc', overflowY: 'auto' }}>
          <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>HTTP/2 Streaming Frames:</div>
          {wireChunks.length === 0 ? (
            <div style={{ color: '#64748b' }}>No chunks streamed yet</div>
          ) : (
            wireChunks.map((chunk, idx) => (
              <div key={idx} style={{ padding: '3px 0', color: chunk.includes('Chunk 0') ? '#34d399' : '#818cf8', borderBottom: '1px solid #1e293b' }}>
                {chunk}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
