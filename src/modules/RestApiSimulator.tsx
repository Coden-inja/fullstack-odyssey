import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const RestApiSimulator: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS'>('GET');
  const [endpoint, setEndpoint] = useState<string>('/api/v1/users/42');
  const [status, setStatus] = useState<number>(200);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'REST API Gateway ready. RFC 7231 / RFC 7235 enabled.' }
  ]);

  const fireRequest = () => {
    let code = 200;
    let out = '';

    if (method === 'OPTIONS') {
      code = 204;
      out = 'CORS Preflight: Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS';
    } else if (method === 'POST') {
      code = 201;
      out = '201 Created: Resource created with Location: /api/v1/users/43';
    } else if (method === 'DELETE') {
      code = 204;
      out = '204 No Content: Resource successfully deleted from database.';
    } else if (method === 'GET' && endpoint.includes('nonexistent')) {
      code = 404;
      out = '404 Not Found: Resource matching identifier does not exist.';
    } else {
      code = 200;
      out = '200 OK: Content-Type: application/json; charset=utf-8';
    }

    setStatus(code);
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'system', text: `${method} ${endpoint}` },
      { id: (Date.now() + 1).toString(), type: code >= 400 ? 'error' : 'success', text: out }
    ]);
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 3</span>
          <span className="badge">HTTP / RFC 7231</span>
        </div>
        <h2 className="sim-title">REST & API Contract Sandbox</h2>
        <p className="sim-desc">
          Test idempotent methods, CORS OPTIONS preflights, status code state transitions (200, 201, 204, 400, 401, 404), and JSON payload contracts.
        </p>
      </div>

      <div className="control-toolbar">
        <select 
          value={method} 
          onChange={(e) => setMethod(e.target.value as any)}
          style={{ background: '#0a0e1c', color: '#fff', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 8, fontFamily: 'var(--font-mono)' }}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="OPTIONS">OPTIONS (CORS)</option>
        </select>

        <input 
          type="text" 
          value={endpoint} 
          onChange={(e) => setEndpoint(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: '#0a0e1c', color: '#fff', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 8, fontFamily: 'var(--font-mono)' }}
        />

        <button className="btn btn-primary" onClick={fireRequest}>Send HTTP Request</button>
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">HTTP Response Status Code</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ 
              fontSize: 36, 
              fontWeight: 800, 
              fontFamily: 'var(--font-mono)',
              color: status < 300 ? 'var(--accent-emerald)' : status < 400 ? 'var(--accent-cyan)' : 'var(--accent-rose)' 
            }}>
              {status}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {status === 200 ? 'OK' : status === 201 ? 'Created' : status === 204 ? 'No Content' : status === 404 ? 'Not Found' : 'Client Error'}
            </span>
          </div>
        </div>
      </div>

      <TerminalPane logs={logs} title="HTTP Network Wire / Headers" />
    </div>
  );
};
