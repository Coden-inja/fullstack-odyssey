import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

interface MockResource {
  id: number;
  title: string;
  amount: number;
  status: 'pending' | 'settled' | 'refunded';
  etag: string;
}

export const RestApiLab: React.FC = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [endpoint, setEndpoint] = useState<string>('/api/v1/orders/101');
  const [requestHeaders] = useState<Record<string, string>>({
    'Accept': 'application/json',
    'Origin': 'https://checkout.retailer.com',
    'Authorization': 'Bearer sec_token_prod_99'
  });
  const [requestBody, setRequestBody] = useState<string>('{\n  "title": "Hardware Security Key",\n  "amount": 89.00,\n  "status": "pending"\n}');
  const [ifNoneMatch, setIfNoneMatch] = useState<string>('');

  // Server state database
  const [database, setDatabase] = useState<Record<number, MockResource>>({
    101: { id: 101, title: 'Enterprise Cloud License', amount: 499.00, status: 'settled', etag: '"w/etag-101-v1"' },
    102: { id: 102, title: 'Developer Support Tier', amount: 150.00, status: 'pending', etag: '"w/etag-102-v1"' }
  });

  // Response state
  const [statusCode, setStatusCode] = useState<number>(200);
  const [statusText, setStatusText] = useState<string>('OK');
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenges completed checklist
  const [achievedOptions, setAchievedOptions] = useState<boolean>(false);
  const [achieved304, setAchieved304] = useState<boolean>(false);
  const [achievedIdempotency, setAchievedIdempotency] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'HTTP RFC 9110 / RFC 7231 wire protocol simulator online.' },
    { id: '2', type: 'output', text: 'Select a method, inspect the raw HTTP wire frame, and test REST semantics.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('rest-api')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  const dispatchHttpRequest = () => {
    const timestamp = Date.now();
    const idMatch = endpoint.match(/\/api\/v1\/orders\/(\d+)/);
    const targetId = idMatch ? parseInt(idMatch[1], 10) : null;

    // 1. CORS Preflight: OPTIONS
    if (method === 'OPTIONS') {
      setStatusCode(204);
      setStatusText('No Content');
      const headers = {
        'Access-Control-Allow-Origin': 'https://checkout.retailer.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
        'Access-Control-Max-Age': '86400',
        'Date': new Date().toUTCString(),
        'Connection': 'keep-alive'
      };
      setResponseHeaders(headers);
      setResponseBody('// 204 No Content: Browser CORS preflight approved. Ready for real HTTP payload.');
      setAchievedOptions(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `--> OPTIONS ${endpoint} HTTP/1.1 (Browser Preflight)` },
        { id: (timestamp + 1).toString(), type: 'success', text: `<-- HTTP/1.1 204 No Content: CORS handshake validated!` }
      ]);
      return;
    }

    // 2. Conditional Request: ETag & 304 Not Modified
    if (method === 'GET' && targetId && database[targetId]) {
      const resource = database[targetId];
      if (ifNoneMatch && ifNoneMatch === resource.etag) {
        setStatusCode(304);
        setStatusText('Not Modified');
        setResponseHeaders({
          'ETag': resource.etag,
          'Cache-Control': 'public, max-age=3600',
          'Date': new Date().toUTCString()
        });
        setResponseBody('// HTTP 304: Zero byte payload transferred over wire. Browser cache is fresh.');
        setAchieved304(true);
        setLogs(p => [
          ...p,
          { id: timestamp.toString(), type: 'system', text: `--> GET ${endpoint} (If-None-Match: ${ifNoneMatch})` },
          { id: (timestamp + 1).toString(), type: 'success', text: `<-- HTTP/1.1 304 Not Modified: Cache validation hit! 0 bytes body.` }
        ]);
        return;
      }

      setStatusCode(200);
      setStatusText('OK');
      setResponseHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'ETag': resource.etag,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': JSON.stringify(resource).length.toString(),
        'Date': new Date().toUTCString()
      });
      setResponseBody(JSON.stringify(resource, null, 2));
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `--> GET ${endpoint} HTTP/1.1` },
        { id: (timestamp + 1).toString(), type: 'success', text: `<-- HTTP/1.1 200 OK: Content-Type application/json (ETag: ${resource.etag})` }
      ]);
      return;
    }

    // 3. POST: Non-idempotent creation
    if (method === 'POST') {
      const nextId = Math.max(...Object.keys(database).map(Number), 100) + 1;
      let parsed = { title: 'New Resource', amount: 99.0, status: 'pending' as const };
      try {
        parsed = JSON.parse(requestBody);
      } catch {}

      const newResource: MockResource = {
        id: nextId,
        title: parsed.title || 'Created Order',
        amount: parsed.amount || 100.0,
        status: parsed.status || 'pending',
        etag: `"w/etag-${nextId}-v1"`
      };

      setDatabase(prev => ({ ...prev, [nextId]: newResource }));
      setStatusCode(201);
      setStatusText('Created');
      setResponseHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'Location': `/api/v1/orders/${nextId}`,
        'ETag': newResource.etag,
        'Date': new Date().toUTCString()
      });
      setResponseBody(JSON.stringify(newResource, null, 2));
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `--> POST ${endpoint} HTTP/1.1 (Non-idempotent)` },
        { id: (timestamp + 1).toString(), type: 'success', text: `<-- HTTP/1.1 201 Created: Location header set to /api/v1/orders/${nextId}` }
      ]);
      return;
    }

    // 4. PUT: Idempotent full replacement
    if (method === 'PUT' && targetId) {
      let parsed = { title: 'Replaced Order', amount: 89.0, status: 'pending' as const };
      try {
        parsed = JSON.parse(requestBody);
      } catch {}

      const updated: MockResource = {
        id: targetId,
        title: parsed.title,
        amount: parsed.amount,
        status: parsed.status,
        etag: `"w/etag-${targetId}-v${Date.now().toString().slice(-4)}"`
      };

      setDatabase(prev => ({ ...prev, [targetId]: updated }));
      setStatusCode(200);
      setStatusText('OK');
      setResponseHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'ETag': updated.etag,
        'Date': new Date().toUTCString()
      });
      setResponseBody(JSON.stringify(updated, null, 2));
      setAchievedIdempotency(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `--> PUT ${endpoint} HTTP/1.1 (Idempotent Replace)` },
        { id: (timestamp + 1).toString(), type: 'success', text: `<-- HTTP/1.1 200 OK: Resource #${targetId} replaced cleanly.` }
      ]);
      return;
    }

    // 5. DELETE: Idempotent deletion
    if (method === 'DELETE' && targetId) {
      if (!database[targetId]) {
        setStatusCode(404);
        setStatusText('Not Found');
        setResponseBody(JSON.stringify({ error: `Order #${targetId} not found` }, null, 2));
        setLogs(p => [
          ...p,
          { id: timestamp.toString(), type: 'error', text: `--> DELETE ${endpoint} -> 404 Not Found (Already deleted)` }
        ]);
        return;
      }
      setDatabase(prev => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
      setStatusCode(204);
      setStatusText('No Content');
      setResponseHeaders({ 'Date': new Date().toUTCString() });
      setResponseBody('// HTTP 204 No Content: Resource successfully deleted from database.');
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `--> DELETE ${endpoint} HTTP/1.1` },
        { id: (timestamp + 1).toString(), type: 'success', text: `<-- HTTP/1.1 204 No Content: Resource #${targetId} removed.` }
      ]);
      return;
    }

    // 404 fallback
    setStatusCode(404);
    setStatusText('Not Found');
    setResponseBody(JSON.stringify({ error: 'Endpoint or resource does not exist', path: endpoint }, null, 2));
    setLogs(p => [
      ...p,
      { id: timestamp.toString(), type: 'error', text: `--> ${method} ${endpoint} -> 404 Not Found` }
    ]);
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('rest-api')) {
        list.push('rest-api');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 03 (REST & API Contracts) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  const isMethodSafe = method === 'GET' || method === 'OPTIONS';
  const isMethodIdempotent = method === 'GET' || method === 'PUT' || method === 'DELETE' || method === 'OPTIONS';

  // Construct raw wire frame
  const rawRequestWire = `${method} ${endpoint} HTTP/1.1\r\nHost: api.enterprise.internal\r\nOrigin: ${requestHeaders['Origin']}\r\nAuthorization: ${requestHeaders['Authorization']}${ifNoneMatch ? `\r\nIf-None-Match: ${ifNoneMatch}` : ''}\r\n${method === 'POST' || method === 'PUT' || method === 'PATCH' ? `Content-Type: application/json\r\nContent-Length: ${requestBody.length}\r\n\r\n${requestBody}` : ''}`;

  return (
    <>
      <div className="lab-panel-left">
        {/* Quest Story */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The Ghost Write & Preflight Handshake</span>
            <span className="badge badge-indigo">Module 03</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            RFC 9110 defines precise mathematical guarantees for HTTP methods:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 10 }}>
            <div style={{ padding: '8px 12px', background: '#040711', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: 12, color: 'var(--indigo)' }}>Safe Semantics</strong>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Read-only; produces zero server state mutation (GET, HEAD, OPTIONS).</p>
            </div>
            <div style={{ padding: '8px 12px', background: '#040711', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: 12, color: 'var(--emerald)' }}>Idempotent Semantics</strong>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>N identical requests produce the identical side effect as 1 request (PUT, DELETE).</p>
            </div>
          </div>
        </div>

        {/* HTTP Request Builder */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Hoppscotch HTTP Request Builder</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className={`badge ${isMethodSafe ? 'badge-emerald' : 'badge-amber'}`}>
                {isMethodSafe ? 'Safe' : 'Unsafe'}
              </span>
              <span className={`badge ${isMethodIdempotent ? 'badge-indigo' : 'badge-rose'}`}>
                {isMethodIdempotent ? 'Idempotent' : 'Non-Idempotent'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              style={{
                background: '#040711',
                color: method === 'GET' ? 'var(--cyan)' : method === 'POST' ? 'var(--emerald)' : method === 'PUT' ? 'var(--amber)' : method === 'DELETE' ? 'var(--rose)' : '#fff',
                border: '1px solid var(--border-subtle)',
                padding: '8px 12px',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>

            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={{
                flex: 1,
                background: '#040711',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                padding: '8px 12px',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12
              }}
            />
          </div>

          {/* Conditional ETag Input for GET */}
          {method === 'GET' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>If-None-Match (Conditional ETag Validation):</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <input
                  type="text"
                  placeholder='e.g. "w/etag-101-v1"'
                  value={ifNoneMatch}
                  onChange={(e) => setIfNoneMatch(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#040711',
                    color: '#fff',
                    border: '1px solid var(--border-subtle)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11
                  }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => setIfNoneMatch('"w/etag-101-v1"')}
                >
                  Use Order #101 ETag
                </button>
              </div>
            </div>
          )}

          {/* Request Payload for POST/PUT */}
          {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>JSON Request Body:</label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  background: '#040711',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  marginTop: 4
                }}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={dispatchHttpRequest}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            ▶ Dispatch HTTP Wire Request
          </button>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>RFC 9110 Challenge Targets</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedOptions ? '✅' : '⏳'}</span>
              <span>Trigger 204 CORS Preflight Handshake (OPTIONS request)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achieved304 ? '✅' : '⏳'}</span>
              <span>Eliminate network bandwidth via 304 Not Modified (ETag Match)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedIdempotency ? '✅' : '⏳'}</span>
              <span>Execute idempotent PUT state mutation</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedOptions && achieved304 && achievedIdempotency ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedOptions || !achieved304 || !achievedIdempotency}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 03 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="HTTP Wire Socket Trace" />
      </div>

      {/* Right Column: Wire Frame & Response Canvas */}
      <div className="lab-panel-right">
        {/* Raw Wire Frame */}
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>Raw HTTP/1.1 Wire Stream</span>
            <span className="badge badge-indigo">POSIX TCP Socket Buffer</span>
          </div>
          <pre style={{
            background: '#040711',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            color: 'var(--cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            overflowX: 'auto',
            marginBottom: 20
          }}>
            {rawRequestWire}
          </pre>

          {/* Response Inspector */}
          <div className="lab-card" style={{ background: '#040711', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 13, color: '#fff' }}>Incoming Wire Response</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${statusCode < 300 ? 'badge-emerald' : statusCode < 400 ? 'badge-cyan' : 'badge-rose'}`}>
                  HTTP/1.1 {statusCode} {statusText}
                </span>
              </div>
            </div>

            {/* Response Headers */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Response Headers:</span>
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '8px 12px',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--indigo)',
                overflowX: 'auto',
                marginTop: 4
              }}>
                {Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`).join('\n') || '// No headers yet'}
              </pre>
            </div>

            {/* Response Body */}
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Response Body:</span>
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '8px 12px',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#fff',
                overflowX: 'auto',
                maxHeight: 160,
                marginTop: 4
              }}>
                {responseBody || '// Awaiting server transmission'}
              </pre>
            </div>
          </div>

          {/* In-Memory Mock Database */}
          <div className="lab-card" style={{ background: '#040711' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: 'var(--emerald)' }}>Server In-Memory Database</strong>
              <span className="badge">State Table</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {Object.values(database).map((res) => (
                <div key={res.id} style={{ padding: '6px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>#{res.id}: {res.title} ({res.status})</span>
                  <span style={{ color: 'var(--indigo)' }}>{res.etag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
