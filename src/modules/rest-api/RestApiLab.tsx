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
      {/* 1. TOP SECTION: Interactive HTTP Client & Companion Action Panel */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live HTTP Client & Response Inspector */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  HTTP Client Workbench
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Configure method and headers, dispatch over loopback TCP socket.
                </div>
              </div>
              {responseStatus && (
                <span className={`badge ${responseStatus >= 200 && responseStatus < 300 ? 'badge-success' : responseStatus >= 300 && responseStatus < 400 ? 'badge-indigo' : 'badge-danger'}`} style={{ fontSize: 12, padding: '4px 10px' }}>
                  HTTP {responseStatus}
                </span>
              )}
            </div>

            {/* URL Bar */}
            <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="module-switcher"
                  style={{
                    fontWeight: 800,
                    color: method === 'GET' ? '#2563eb' : method === 'POST' ? '#059669' : method === 'DELETE' ? '#dc2626' : '#7c3aed',
                    borderColor: 'var(--border-strong)',
                    background: '#ffffff',
                    padding: '7px 12px',
                    fontSize: 12.5
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="DELETE">DELETE</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>

                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1.5px solid var(--border-strong)',
                    borderRadius: 9999,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    outline: 'none',
                    background: '#ffffff'
                  }}
                  placeholder="/api/users"
                />

                <button className="btn btn-primary btn-pill" onClick={sendRequest} style={{ gap: 6, fontWeight: 700, padding: '8px 16px', fontSize: 12.5 }}>
                  <Send size={12} />
                  Send
                </button>
              </div>

              {/* Header Flags */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 4 }}>
                <span style={{ fontWeight: 600 }}>Headers:</span>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={includeEtag}
                    onChange={(e) => setIncludeEtag(e.target.checked)}
                  />
                  Send ETag If-None-Match: "w91a-882f"
                </label>
              </div>
            </div>

            {/* Response Inspector */}
            <div style={{ background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
                  HTTP Response Payload Inspector
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Content-Type: application/json
                </span>
              </div>
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, flex: 1, minHeight: 140, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc' }}>
                {responseBody ? (
                  <pre style={{ margin: 0 }}>{responseBody}</pre>
                ) : (
                  <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', paddingTop: 40 }}>
                    No response received yet. Select an HTTP method, endpoint, and click "Send".
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact Wire Terminal & Check Answer */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {REST_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  className={`btn btn-sm ${levelIdx === idx ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLevelIdx(idx)}
                  style={{ borderRadius: 9999, padding: '3px 10px', fontSize: 11 }}
                >
                  Level {lvl.id}
                </button>
              ))}
            </div>

            {/* Important Bullets Box */}
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
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowHint(!showHint)} style={{ fontSize: 11, padding: '4px 8px' }}>
                  <HelpCircle size={11} />
                  {showHint ? 'Hide Hint' : 'Hint'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={autoPlaySolution} style={{ fontSize: 11, padding: '4px 8px' }}>
                  <Eye size={11} />
                  Auto-Fill
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => resetLevel(levelIdx)} style={{ fontSize: 11, padding: '4px 8px' }}>
                  <RefreshCw size={11} />
                  Reset
                </button>
              </div>

              {showHint && (
                <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 11.5, color: '#92400e' }}>
                  <strong>Hint: </strong>{currentLevel.hint}
                </div>
              )}
            </div>

            {/* Compact Authentic macOS Wire Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  TCP SOCKET WIRE STREAM
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 12px' }}>
                {wireLog.length === 0 ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    Awaiting packets... Click "Send" above.
                  </div>
                ) : (
                  wireLog.map((line, idx) => (
                    <div key={idx} className="terminal-line" style={{ color: line.startsWith('>') ? '#38bdf8' : line.startsWith('< HTTP/1.1 2') ? '#4ade80' : line.startsWith('< HTTP/1.1 3') ? '#818cf8' : '#cbd5e1' }}>
                      <span className="glyph" style={{ color: line.startsWith('>') ? '#38bdf8' : line.startsWith('< HTTP/1.1 2') ? '#4ade80' : '#a1a1aa' }}>
                        {line.startsWith('>') ? '→' : line.startsWith('< HTTP') ? '✓' : '•'}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verification Button & Result */}
            <div>
              <button
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontWeight: 700, fontSize: 13 }}
              >
                <CheckCircle2 size={13} />
                Check My Answer
              </button>

              {validationMsg && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    background: validationMsg.passed ? 'var(--success-light)' : 'var(--danger-light)',
                    border: `1px solid ${validationMsg.passed ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    color: validationMsg.passed ? '#065f46' : '#991b1b',
                    fontWeight: 600
                  }}
                >
                  {validationMsg.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Scroll for In-Depth Architectural Mechanics & War Story */}
      <div className="lab-lesson-bottom">
        {/* Left Card: Core Concept Deep Dive */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            RFC Standards &amp; Architecture
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            HTTP/1.1 Protocol Mechanics
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>Wire Protocol Anatomy (RFC 9112):</div>
            <div>METHOD /uri HTTP/1.1\r\n</div>
            <div>Host: api.production.internal\r\n</div>
            <div>Accept: application/json\r\n</div>
            <div>\r\n</div>
            <div style={{ color: '#94a3b8' }}>[Optional Binary / JSON Stream Payload]</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The Cost of Protocol Violations
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> HTTP safe methods (GET, HEAD, OPTIONS) MUST never alter server state. If an automated web crawler hits a GET endpoint that triggers deletions or charges, disaster ensues.
          </div>
        </div>
      </div>
    </div>
  );
};
