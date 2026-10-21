import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

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
    hint: 'Switch the method dropdown from GET to POST and click "Send HTTP Request".',
    method: 'POST',
    path: '/api/users',
    targetStatus: 201
  },
  {
    id: 2,
    title: 'Level 2: Safe & Idempotent Actions',
    subtitle: 'Why DELETE Won’t Duplicate Work',
    story: 'If a payment or delete button glitches and fires 3 times in a row, what happens? That depends on whether the HTTP method is idempotent.',
    concept: 'An operation is "Idempotent" if running it once or running it 100 times produces the exact same final result. DELETE is idempotent: deleting user #42 once removes them; deleting user #42 again still leaves them removed. POST is NOT idempotent.',
    goalDescription: 'Send a DELETE request to /api/users/42 and watch the server return 204 No Content.',
    hint: 'Select DELETE method and click "Send HTTP Request".',
    method: 'DELETE',
    path: '/api/users/42',
    targetStatus: 204
  },
  {
    id: 3,
    title: 'Level 3: Browser Permissions (CORS)',
    subtitle: 'The Invisible Preflight OPTIONS Request',
    story: 'Why does your browser sometimes send a request you never wrote? If your frontend app lives on a different domain than your API, the browser steps in to protect users.',
    concept: 'Cross-Origin Resource Sharing (CORS): when a website on `frontend.io` tries to send custom headers to `api.service.com`, the browser automatically sends an HTTP OPTIONS preflight request first to ask permission.',
    goalDescription: 'Switch the Origin to "https://untrusted-site.com" and click "Send HTTP Request" to see the preflight OPTIONS handshake succeed.',
    hint: 'Ensure Origin is set to cross-origin and dispatch the request.',
    method: 'OPTIONS',
    path: '/api/users',
    targetStatus: 204
  },
  {
    id: 4,
    title: 'Level 4: Saving Bandwidth with ETags',
    subtitle: 'HTTP 304 Not Modified',
    story: 'Why re-download a large list of products or user settings if not a single byte has changed since your last visit?',
    concept: 'The server provides an ETag (fingerprint of data). When you request again with `If-None-Match: "w91a"`, the server compares the fingerprint. If identical, it returns 304 Not Modified with ZERO response body bytes!',
    goalDescription: 'Toggle "Send Cached ETag: true", send a GET request, and observe HTTP 304 with 0 bytes transferred.',
    hint: 'Enable the "If-None-Match" header checkbox and click "Send HTTP Request".',
    method: 'GET',
    path: '/api/products',
    targetStatus: 304
  }
];

export const RestApiLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = REST_LEVELS[levelIdx];

  const [method, setMethod] = useState<'GET' | 'POST' | 'DELETE' | 'OPTIONS'>(currentLevel.method);
  const [path, setPath] = useState<string>(currentLevel.path);
  const [origin, setOrigin] = useState<string>('https://app.example.com');
  const [includeEtag, setIncludeEtag] = useState<boolean>(false);

  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [wireLog, setWireLog] = useState<string[]>([]);

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon && responseStatus === currentLevel.targetStatus) {
      setLevelWon(true);
      saveModuleCompletion();
    }
  }, [responseStatus, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('rest-api')) {
        list.push('rest-api');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    const l = REST_LEVELS[idx];
    setMethod(l.method);
    setPath(l.path);
    setOrigin('https://app.example.com');
    setIncludeEtag(false);
    setResponseStatus(null);
    setResponseHeaders({});
    setResponseBody(null);
    setWireLog([]);
    setShowHint(false);
    setLevelWon(false);
  };

  const sendRequest = () => {
    const logs: string[] = [];

    // Preflight check for Level 3
    if (currentLevel.id === 3 || method === 'OPTIONS') {
      logs.push(`> OPTIONS ${path} HTTP/1.1`);
      logs.push(`> Host: api.odyssey.internal`);
      logs.push(`> Origin: ${origin}`);
      logs.push(`> Access-Control-Request-Method: POST`);
      logs.push(`< HTTP/1.1 204 No Content`);
      logs.push(`< Access-Control-Allow-Origin: *`);
      logs.push(`< Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`);
      setResponseStatus(204);
      setResponseHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS'
      });
      setResponseBody('// Preflight OK. Browser permitted cross-origin request.');
      setWireLog(logs);
      return;
    }

    logs.push(`> ${method} ${path} HTTP/1.1`);
    logs.push(`> Host: api.odyssey.internal`);
    logs.push(`> Origin: ${origin}`);

    if (includeEtag && currentLevel.id === 4) {
      logs.push(`> If-None-Match: "w91a-882f"`);
      logs.push(`< HTTP/1.1 304 Not Modified`);
      logs.push(`< ETag: "w91a-882f"`);
      logs.push(`< Content-Length: 0`);
      setResponseStatus(304);
      setResponseHeaders({ 'etag': '"w91a-882f"', 'content-length': '0' });
      setResponseBody('// 304 Not Modified: Cache is fresh. 0 bytes transferred over wire.');
      setWireLog(logs);
      return;
    }

    if (method === 'GET') {
      logs.push(`< HTTP/1.1 200 OK`);
      logs.push(`< Content-Type: application/json`);
      setResponseStatus(200);
      setResponseHeaders({ 'content-type': 'application/json', 'etag': '"w91a-882f"' });
      setResponseBody(JSON.stringify({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }, null, 2));
    } else if (method === 'POST') {
      logs.push(`> Content-Type: application/json`);
      logs.push(`> {"name": "Charlie", "email": "charlie@example.com"}`);
      logs.push(`< HTTP/1.1 201 Created`);
      logs.push(`< Location: /api/users/42`);
      setResponseStatus(201);
      setResponseHeaders({ 'content-type': 'application/json', 'location': '/api/users/42' });
      setResponseBody(JSON.stringify({ id: 42, name: 'Charlie', status: 'created' }, null, 2));
    } else if (method === 'DELETE') {
      logs.push(`< HTTP/1.1 204 No Content`);
      setResponseStatus(204);
      setResponseHeaders({});
      setResponseBody('// 204 No Content: Resource successfully deleted.');
    }

    setWireLog(logs);
  };

  const autoPlaySolution = () => {
    resetLevel(levelIdx);
    setTimeout(() => {
      if (currentLevel.id === 1) setMethod('POST');
      if (currentLevel.id === 2) setMethod('DELETE');
      if (currentLevel.id === 3) setMethod('OPTIONS');
      if (currentLevel.id === 4) setIncludeEtag(true);

      setTimeout(() => {
        sendRequest();
      }, 400);
    }, 200);
  };

  return (
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {REST_LEVELS.map((lvl, idx) => (
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

          {/* Interactive Request Builder Controls */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
              Request Configuration:
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="module-switcher"
                style={{ fontWeight: 700 }}
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
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border-strong)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>

            {currentLevel.id === 4 && (
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={includeEtag}
                  onChange={(e) => setIncludeEtag(e.target.checked)}
                />
                Send Cached ETag (If-None-Match: "w91a-882f")
              </label>
            )}
          </div>

          <div className="lesson-actions">
            <button className="btn btn-primary btn-sm" onClick={sendRequest}>
              Send HTTP Request →
            </button>
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered HTTP contracts and status codes.</div>
            </div>
            {levelIdx < REST_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Wire Inspector */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">HTTP Wire Socket & Status Code Inspector</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              See raw HTTP/1.1 frames traveling between browser and web server.
            </div>
          </div>
          <div>
            {responseStatus && (
              <span className={`badge ${responseStatus >= 200 && responseStatus < 300 ? 'badge-success' : responseStatus >= 300 && responseStatus < 400 ? 'badge-indigo' : 'badge-danger'}`}>
                HTTP {responseStatus}
              </span>
            )}
          </div>
        </div>

        {/* Authentic macOS Wire Protocol Terminal */}
        <div className="terminal-window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

          <div className="terminal-body" style={{ flex: 1, overflowY: 'auto', maxHeight: 220 }}>
            {wireLog.length === 0 ? (
              <div style={{ color: '#71717a', fontStyle: 'italic', padding: '6px 0' }}>
                Click "Send HTTP Request" above to stream raw TCP socket frames...
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
    </div>
  );
};
