import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

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
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Visual RSC Wire Stream & Companion Controls */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live Component DOM & React Flight Stream */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  React Server Components &amp; Flight Stream
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Progressive HTML chunking, Suspense boundaries, and selective client hydration.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-indigo">React 18/19 Flight</span>
                <span className="badge">{streamStage === 'idle' ? 'Awaiting Stream' : streamStage === 'shell' ? 'Chunk 0 Paint' : 'Chunk 1 Complete'}</span>
              </div>
            </div>

            {/* Browser Render Canvas */}
            <div style={{ background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: 10, padding: 14 }}>
              {streamStage === 'idle' ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                  Blank Browser Viewport. Click "Stream Initial Shell" to start transfer.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)' }}>Odyssey App Shell</span>
                    <span className="badge badge-success" style={{ fontSize: 10 }}>Fast Shell 15ms</span>
                  </div>

                  {streamStage === 'shell' ? (
                    <div style={{ background: '#f1f5f9', padding: 20, borderRadius: 8, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                      <span className="terminal-cursor" style={{ marginRight: 6 }} />
                      Suspense Boundary Fallback: Loading Server Data...
                    </div>
                  ) : (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#065f46', fontSize: 13 }}>Server Data: 12 New Orders Loaded</div>
                        <div style={{ fontSize: 11, color: '#047857' }}>HTML streaming replaced skeleton without page refresh.</div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleLikeClick}
                        style={{ fontSize: 11, padding: '4px 10px' }}
                      >
                        👍 Like ({likeCount})
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: isHydrated ? '#059669' : '#d97706', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Client Island Hydration: <strong>{isHydrated ? 'Hydrated (Interactive)' : 'HTML Only (Waiting for JS)'}</strong></span>
                    {queuedClicks > 0 && <span style={{ color: '#dc2626', fontWeight: 700 }}>Queued clicks: {queuedClicks}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact Chunk Terminal & Actions */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {RSC_LEVELS.map((lvl, idx) => (
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
                  <button className="btn btn-primary btn-sm" onClick={streamShell} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Stream Shell (Chunk 0)
                  </button>
                )}
                {currentLevel.id === 2 && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={streamShell} style={{ fontSize: 11, padding: '4px 8px' }}>
                      1. Shell
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={streamData} style={{ fontSize: 11, padding: '4px 10px' }}>
                      2. Stream Data
                    </button>
                  </>
                )}
                {currentLevel.id === 3 && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={triggerHydration} style={{ fontSize: 11, padding: '4px 10px' }}>
                      Hydrate Island
                    </button>
                  </>
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

            {/* Compact Authentic macOS Chunk Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  HTTP/2 CHUNKED STREAM INSPECTOR
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {wireChunks.length === 0 ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    Awaiting chunk transmission... Click "Stream Shell" above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {wireChunks.map((chunk, idx) => (
                      <div key={idx} className="terminal-line" style={{ color: chunk.startsWith('HTTP') ? '#38bdf8' : chunk.includes('Chunk 0') ? '#cbd5e1' : '#4ade80' }}>
                        <span className="glyph">•</span>
                        <span>{chunk}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Level Completion Status */}
            {levelWon && (
              <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 12 }}>Level Completed!</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered React Server Component Flight streaming.</div>
                </div>
                {levelIdx < RSC_LEVELS.length - 1 ? (
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
        {/* Left Card: RSC Flight Protocol Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            Modern Frontend Architecture
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            React Flight Protocol &amp; Suspense Wire Streaming
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Wire Format Anatomy:</div>
            <div>{'M1:{"id":"./src/LikeBtn.js","chunks":["client-0"],"name":""}'}</div>
            <div>{'J0:[["$","nav",null,{"children":"Odyssey"}],["$","$L1",null,{}]]'}</div>
            <div style={{ color: '#94a3b8', marginTop: 4 }}>Server Component code is never sent to the browser. Only the lightweight serialized Flight AST and client island references travel over the wire.</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The Root Component Waterfall Freeze
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> If a slow database query is placed at the root level of a server component without a `Suspense` boundary, it blocks the initial HTTP shell transfer, turning a streaming architecture back into a slow, blocking SSR render.
          </div>
        </div>
      </div>
    </div>
  );
};
