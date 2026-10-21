import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, RefreshCw, CheckCircle2, ArrowRight, HelpCircle, Eye } from 'lucide-react';

interface RestApiLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  method: 'GET' | 'POST' | 'DELETE' | 'OPTIONS';
  path: string;
  targetStatus: number;
  expectedHeadersCheck?: (headers: Record<string, string>) => boolean;
}

const REST_LEVELS: RestApiLevel[] = [
  {
    id: 1,
    title: 'Level 1: Reading vs Creating Data',
    subtitle: 'GET (200 OK) vs POST (201 Created)',
    story: 'When you open a profile, your browser fetches data. When you sign up, your browser creates data. HTTP uses different methods to signal the server what you want to do.',
    concept: 'GET requests fetch existing data and should never modify server state. The server responds with HTTP 200 OK. POST requests submit a body payload to create a new resource. The server responds with HTTP 201 Created.',
    goalDescription: 'Select POST method, click "Send HTTP Request", and observe the server respond with HTTP 201 Created.',
    hint: 'Switch the method dropdown from GET to POST, then click Send.',
    method: 'POST',
    path: '/api/users',
    targetStatus: 201
  },
  {
    id: 2,
    title: 'Level 2: Safe Deletion & Missing Resources',
    subtitle: 'DELETE (200 OK) & 404 Not Found',
    story: 'Deleting a user account requires explicit intent. If a client attempts to delete an account ID that does not exist in the database, the server must reject it cleanly.',
    concept: 'DELETE removes an existing entity. If the record exists, the server returns 200 OK (or 204 No Content). If the ID does not exist, the server returns 404 Not Found.',
    goalDescription: 'Send a DELETE request to /api/users/999 to observe a 404 Not Found rejection, then switch path to /api/users/42 and send DELETE to successfully delete it (200 OK).',
    hint: 'First set method to DELETE and path to /api/users/999 (fails with 404). Then change path to /api/users/42 and send again.',
    method: 'DELETE',
    path: '/api/users/42',
    targetStatus: 200
  },
  {
    id: 3,
    title: 'Level 3: CORS Preflight Handshake',
    subtitle: 'Cross-Origin Resource Sharing & OPTIONS',
    story: 'When a web app running on localhost:3000 calls an API on api.acme.com, the browser security sandbox pauses the request. It fires an automated "Preflight" check first.',
    concept: 'The browser automatically issues an OPTIONS request with Origin and Access-Control-Request-Method headers before sending complex cross-domain requests. If the server does not reply with Access-Control-Allow-Origin, the browser blocks the response.',
    goalDescription: 'Switch method to OPTIONS and path to /api/users to inspect the preflight handshake headers returned by the server.',
    hint: 'Select OPTIONS method and click Send Request.',
    method: 'OPTIONS',
    path: '/api/users',
    targetStatus: 204
  },
  {
    id: 4,
    title: 'Level 4: HTTP Caching & 304 Not Modified',
    subtitle: 'Conditional Requests with ETags',
    story: 'Downloading megabytes of JSON repeatedly wastes bandwidth and CPU. HTTP ETags assign a cryptographic fingerprint to resources so servers can tell browsers: "Nothing changed, keep using your cache!"',
    concept: 'When a client sends `If-None-Match: "w91a-882f"`, the server compares the hash with current data. If identical, the server sends a tiny `304 Not Modified` frame with 0 bytes body.',
    goalDescription: 'Send a GET to /api/users with the ETag header checked to receive a 304 Not Modified status without downloading redundant bytes.',
    hint: 'Select GET method, ensure the ETag checkbox is checked, and send request.',
    method: 'GET',
    path: '/api/users',
    targetStatus: 304
  }
];

export const RestApiLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [method, setMethod] = useState<'GET' | 'POST' | 'DELETE' | 'OPTIONS'>('GET');
  const [path, setPath] = useState('/api/users');
  const [includeEtag, setIncludeEtag] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [wireLog, setWireLog] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [levelWon, setLevelWon] = useState(false);
  const [validationMsg, setValidationMsg] = useState<{ passed: boolean; message: string } | null>(null);

  const currentLevel = REST_LEVELS[levelIdx];

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  const resetLevel = (idx: number) => {
    const lvl = REST_LEVELS[idx];
    setMethod(lvl.id === 1 ? 'GET' : lvl.id === 2 ? 'DELETE' : 'GET');
    setPath(lvl.id === 2 ? '/api/users/999' : '/api/users');
    setIncludeEtag(false);
    setResponseStatus(null);
    setResponseBody(null);
    setWireLog([]);
    setShowHint(false);
    setLevelWon(false);
    setValidationMsg(null);
  };

  const sendRequest = () => {
    const timestamp = new Date().toISOString();
    const frames: string[] = [];

    // Client Request Frame
    frames.push(`> ${method} ${path} HTTP/1.1`);
    frames.push(`> Host: api.fullstack-odyssey.dev`);
    frames.push(`> User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537.36`);
    frames.push(`> Accept: application/json`);

    if (method === 'POST') {
      frames.push(`> Content-Type: application/json`);
      frames.push(`> Content-Length: 48`);
      frames.push(`> `);
      frames.push(`> {"name":"Sarah Connor","role":"Security Engineer"}`);
    } else if (method === 'OPTIONS') {
      frames.push(`> Origin: https://app.fullstack-odyssey.dev`);
      frames.push(`> Access-Control-Request-Method: POST`);
      frames.push(`> Access-Control-Request-Headers: Content-Type, Authorization`);
    } else if (includeEtag) {
      frames.push(`> If-None-Match: "w91a-882f"`);
    }

    frames.push(''); // blank separator

    // Server Response Frame Calculation
    let status = 200;
    let body = '';

    if (method === 'OPTIONS') {
      status = 204;
      frames.push(`< HTTP/1.1 204 No Content`);
      frames.push(`< Access-Control-Allow-Origin: https://app.fullstack-odyssey.dev`);
      frames.push(`< Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`);
      frames.push(`< Access-Control-Allow-Headers: Content-Type, Authorization`);
      frames.push(`< Access-Control-Max-Age: 86400`);
      body = '(No content - preflight pre-approved by CORS policy)';
    } else if (method === 'POST' && path === '/api/users') {
      status = 201;
      frames.push(`< HTTP/1.1 201 Created`);
      frames.push(`< Location: /api/users/104`);
      frames.push(`< Content-Type: application/json; charset=utf-8`);
      body = JSON.stringify({ id: 104, name: "Sarah Connor", role: "Security Engineer", createdAt: timestamp }, null, 2);
    } else if (method === 'DELETE' && path === '/api/users/999') {
      status = 404;
      frames.push(`< HTTP/1.1 404 Not Found`);
      frames.push(`< Content-Type: application/json; charset=utf-8`);
      body = JSON.stringify({ error: "UserNotFound", message: "User with ID 999 does not exist in relational store." }, null, 2);
    } else if (method === 'DELETE' && path === '/api/users/42') {
      status = 200;
      frames.push(`< HTTP/1.1 200 OK`);
      frames.push(`< Content-Type: application/json; charset=utf-8`);
      body = JSON.stringify({ success: true, message: "User 42 deleted successfully." }, null, 2);
    } else if (method === 'GET' && includeEtag) {
      status = 304;
      frames.push(`< HTTP/1.1 304 Not Modified`);
      frames.push(`< ETag: "w91a-882f"`);
      frames.push(`< Cache-Control: max-age=3600, must-revalidate`);
      body = '(304 Not Modified: 0 payload bytes transmitted. Browser cache re-validated.)';
    } else {
      status = 200;
      frames.push(`< HTTP/1.1 200 OK`);
      frames.push(`< Content-Type: application/json; charset=utf-8`);
      frames.push(`< ETag: "w91a-882f"`);
      body = JSON.stringify({ users: [{ id: 42, name: "Alice Vance" }, { id: 101, name: "Gordon Freeman" }] }, null, 2);
    }

    setResponseStatus(status);
    setResponseBody(body);
    setWireLog(frames);
  };

  const handleCheckAnswer = () => {
    if (responseStatus === null) {
      setValidationMsg({
        passed: false,
        message: 'You have not sent an HTTP request yet. Configure the method and path, then click "Send Request".'
      });
      return;
    }

    if (responseStatus === currentLevel.targetStatus && method === currentLevel.method) {
      setLevelWon(true);
      setValidationMsg({
        passed: true,
        message: `Verification Passed! Received expected HTTP ${responseStatus} with valid wire protocol semantics.`
      });
      markCompleted(currentLevel.id);
    } else {
      setValidationMsg({
        passed: false,
        message: `Received HTTP ${responseStatus} with ${method}, but Level ${currentLevel.id} requires ${currentLevel.method} returning HTTP ${currentLevel.targetStatus}. Check the objective.`
      });
    }
  };

  const markCompleted = (id: number) => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list: string[] = saved ? JSON.parse(saved) : [];
      if (!list.includes('rest-api')) {
        list.push('rest-api');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const autoPlaySolution = () => {
    setMethod(currentLevel.method);
    setPath(currentLevel.path);
    if (currentLevel.id === 4) setIncludeEtag(true);

    setTimeout(() => {
      sendRequest();
    }, 200);
  };

  return (
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Interactive HTTP Client Workbench & macOS Wire Terminal (Immediate, Zero-Scroll) */}
      <div className="lab-workbench-top">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div className="canvas-title" style={{ fontSize: 18, marginBottom: 2 }}>
              HTTP Client Workbench &amp; Wire Protocol Inspector
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Configure request methods, routes, and headers. Observe real-time TCP socket frames.
            </div>
          </div>
          <div>
            {responseStatus && (
              <span className={`badge ${responseStatus >= 200 && responseStatus < 300 ? 'badge-success' : responseStatus >= 300 && responseStatus < 400 ? 'badge-indigo' : 'badge-danger'}`} style={{ fontSize: 13, padding: '5px 12px' }}>
                HTTP {responseStatus}
              </span>
            )}
          </div>
        </div>

        {/* Interactive URL Bar & Request Controls */}
        <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            {/* Method Selector */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="module-switcher"
              style={{
                fontWeight: 800,
                color: method === 'GET' ? '#2563eb' : method === 'POST' ? '#059669' : method === 'DELETE' ? '#dc2626' : '#7c3aed',
                borderColor: 'var(--border-strong)',
                background: '#ffffff',
                padding: '8px 14px'
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="DELETE">DELETE</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>

            {/* Path Input */}
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 14px',
                border: '1.5px solid var(--border-strong)',
                borderRadius: 9999,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                outline: 'none',
                background: '#ffffff'
              }}
              placeholder="/api/users"
            />

            {/* Send Request Button */}
            <button className="btn btn-primary btn-pill" onClick={sendRequest} style={{ gap: 6, fontWeight: 700, padding: '9px 20px' }}>
              <Send size={13} />
              Send Request
            </button>
          </div>

          {/* Header Options */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', paddingLeft: 4 }}>
            <span style={{ fontWeight: 600 }}>Header Flags:</span>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={includeEtag}
                onChange={(e) => setIncludeEtag(e.target.checked)}
              />
              Send Cached ETag (If-None-Match: "w91a-882f")
            </label>
          </div>
        </div>

        {/* Authentic macOS Wire Protocol Terminal */}
        <div className="terminal-window" style={{ minHeight: 200 }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <span className="terminal-title">
              <TerminalIcon size={12} style={{ color: '#38bdf8' }} />
              RAW TCP SOCKET FRAMES — HTTP/1.1 WIRE
            </span>
            <div style={{ width: 36 }} />
          </div>

          <div className="terminal-body" style={{ maxHeight: 180, overflowY: 'auto' }}>
            {wireLog.length === 0 ? (
              <div style={{ color: '#71717a', fontStyle: 'italic', padding: '6px 0' }}>
                Click "Send Request" above to stream raw TCP socket frames between browser and server...
              </div>
            ) : (
              wireLog.map((line, idx) => (
                <div key={idx} className="terminal-line" style={{ color: line.startsWith('>') ? '#38bdf8' : line.startsWith('< HTTP/1.1 2') ? '#4ade80' : line.startsWith('< HTTP/1.1 3') ? '#818cf8' : '#f4f4f5' }}>
                  <span className="glyph" style={{ color: line.startsWith('>') ? '#38bdf8' : line.startsWith('< HTTP/1.1 2') ? '#4ade80' : '#a1a1aa' }}>
                    {line.startsWith('>') ? '→' : line.startsWith('< HTTP') ? '✓' : '•'}
                  </span>
                  <span>{line}</span>
                </div>
              ))
            )}
          </div>

          {responseBody && (
            <div style={{ padding: '10px 16px', background: 'rgba(255, 255, 255, 0.04)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Response Body Payload:
              </div>
              <pre style={{ margin: 0, color: '#f4f4f5', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{responseBody}</pre>
            </div>
          )}
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Course Syllabus & Learning Guide (Below Workbench) */}
      <div className="lab-lesson-bottom">
        {/* Left Card: Objective & Verification */}
        <div className="lesson-objective-card">
          <div>
            {/* Level Indicator Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {REST_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  className={`btn btn-sm ${levelIdx === idx ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLevelIdx(idx)}
                  style={{ borderRadius: 9999, padding: '4px 12px' }}
                >
                  Level {lvl.id}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                {currentLevel.subtitle}
              </div>
              <h2 className="lesson-step-title">{currentLevel.title}</h2>
            </div>

            <div className="lesson-goal-box" style={{ marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Your Objective:</div>
                <div>{currentLevel.goalDescription}</div>
              </div>
            </div>

            <div className="lesson-actions" style={{ marginBottom: 14 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowHint(!showHint)}>
                <HelpCircle size={12} />
                {showHint ? 'Hide Hint' : 'Need a Hint?'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={autoPlaySolution}>
                <Eye size={12} />
                Auto-Fill Solution
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => resetLevel(levelIdx)}>
                <RefreshCw size={12} />
                Reset Level
              </button>
            </div>

            {showHint && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                <strong>Hint: </strong>{currentLevel.hint}
              </div>
            )}
          </div>

          {/* Validation Check Button */}
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
            <button
              className="btn btn-primary"
              onClick={handleCheckAnswer}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontWeight: 700 }}
            >
              <CheckCircle2 size={14} />
              Check My Answer
            </button>

            {validationMsg && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  background: validationMsg.passed ? 'var(--success-light)' : 'var(--danger-light)',
                  border: `1px solid ${validationMsg.passed ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  color: validationMsg.passed ? '#065f46' : '#991b1b',
                  fontWeight: 500
                }}
              >
                {validationMsg.message}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Story Dilemma, Architectural Concept & Next Level Bridge */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
            System Architecture &amp; Why It Matters
          </div>

          <p className="lesson-explanation" style={{ margin: 0 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Key Architectural Concept:</strong>
            {currentLevel.concept}
          </div>

          {/* Narrative Bridge to Next Level */}
          {levelWon && levelIdx < REST_LEVELS.length - 1 ? (
            <div style={{ marginTop: 'auto', background: 'var(--bento-mint-bg)', border: '1.5px solid var(--bento-mint-border)', padding: 14, borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bento-mint-text)', marginBottom: 2 }}>
                Next Up: {REST_LEVELS[levelIdx + 1].title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--bento-mint-text)', opacity: 0.85, marginBottom: 10 }}>
                Now that you completed this level, advance to the next concept.
              </div>
              <button
                className="btn btn-success btn-sm btn-pill"
                onClick={() => setLevelIdx(levelIdx + 1)}
                style={{ gap: 6 }}
              >
                Advance to Level {levelIdx + 2}
                <ArrowRight size={12} />
              </button>
            </div>
          ) : levelWon && (
            <div style={{ marginTop: 'auto', background: 'var(--success-light)', border: '1.5px solid var(--success-border)', padding: 14, borderRadius: 12, color: '#065f46', fontWeight: 700 }}>
              🎉 Module Mastered! All 4 REST API levels completed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
