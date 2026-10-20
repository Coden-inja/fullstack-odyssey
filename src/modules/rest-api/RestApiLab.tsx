import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const RestApiLab: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS'>('GET');
  const [endpoint, setEndpoint] = useState<string>('/api/v1/users/42');
  const [responseCode, setResponseCode] = useState<number>(200);
  const [latency, setLatency] = useState<number>(24);
  const [responseBody, setResponseBody] = useState<string>('{\n  "id": 42,\n  "name": "Alex Mercer",\n  "role": "Lead Architect",\n  "status": "active"\n}');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'REST API Sandbox initialized. RFC 7231 / RFC 7235 compliance enabled.' }
  ]);

  const sendRequest = () => {
    const lat = Math.floor(Math.random() * 25) + 15;
    setLatency(lat);

    if (method === 'OPTIONS') {
      setResponseCode(204);
      setResponseBody('// CORS Preflight Handshake\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\nAccess-Control-Allow-Headers: Content-Type, Authorization\nAccess-Control-Max-Age: 86400');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: `OPTIONS ${endpoint} HTTP/1.1 (Preflight)` },
        { id: (Date.now() + 1).toString(), type: 'success', text: `HTTP 204 No Content (${lat}ms) - CORS Handshake Verified` }
      ]);
    } else if (method === 'POST') {
      setResponseCode(201);
      setResponseBody('{\n  "id": 43,\n  "created_at": "2026-10-21T05:00:00Z",\n  "status": "created"\n}');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: `POST ${endpoint} HTTP/1.1` },
        { id: (Date.now() + 1).toString(), type: 'success', text: `HTTP 201 Created (${lat}ms) - Location: /api/v1/users/43` }
      ]);
    } else if (method === 'DELETE') {
      setResponseCode(204);
      setResponseBody('// 204 No Content: Resource successfully deleted.');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: `DELETE ${endpoint} HTTP/1.1` },
        { id: (Date.now() + 1).toString(), type: 'success', text: `HTTP 204 No Content (${lat}ms) - Resource excised` }
      ]);
    } else {
      setResponseCode(200);
      setResponseBody('{\n  "id": 42,\n  "name": "Alex Mercer",\n  "role": "Lead Architect",\n  "status": "active"\n}');
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'system', text: `GET ${endpoint} HTTP/1.1` },
        { id: (Date.now() + 1).toString(), type: 'success', text: `HTTP 200 OK (${lat}ms) - Content-Type: application/json` }
      ]);
    }
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">HTTP Request Builder (Hoppscotch Style)</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              style={{ background: '#05070f', color: '#fff', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
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
              style={{ flex: 1, background: '#05070f', color: '#fff', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
          </div>

          <button className="btn btn-primary" onClick={sendRequest} style={{ width: '100%', justifyContent: 'center' }}>
            Dispatch Request →
          </button>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">RFC 7231 Idempotency Rules</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p><strong>Idempotent:</strong> GET, PUT, DELETE, OPTIONS produce identical side effects when re-executed N times.</p>
            <p style={{ marginTop: 6 }}><strong>Non-Idempotent:</strong> POST creates new resources on each invocation.</p>
          </div>
        </div>

        <TerminalPane logs={logs} title="Raw HTTP Wire Headers" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>HTTP Response Inspector</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className={`badge ${responseCode < 300 ? 'badge-emerald' : 'badge-amber'}`}>
                HTTP {responseCode}
              </span>
              <span className="badge">{latency} ms</span>
            </div>
          </div>

          <div style={{ background: '#030509', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#a5b4fc', whiteSpace: 'pre-wrap' }}>
            {responseBody}
          </div>
        </div>
      </div>
    </>
  );
};
