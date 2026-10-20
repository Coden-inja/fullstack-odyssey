import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../components/TerminalPane';

export const AuthJwtSimulator: React.FC = () => {
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Auth Service booted with RS256 Asymmetric Key Pair.' }
  ]);

  const testAuth = () => {
    if (isExpired) {
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'error', text: 'Access Token: Expired! (HTTP 401 Unauthorized)' },
        { id: (Date.now() + 1).toString(), type: 'output', text: 'Invoking POST /api/auth/refresh with HttpOnly Secure Cookie...' },
        { id: (Date.now() + 2).toString(), type: 'success', text: 'Refresh Token verified! Issued new 15m Access Token & rotated refresh cookie.' }
      ]);
      setIsExpired(false);
    } else {
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'output', text: 'Authorization: Bearer <RS256 JWT>' },
        { id: (Date.now() + 1).toString(), type: 'success', text: 'Signature valid via Public Key! Identity: { uid: "usr_99", role: "admin" }' }
      ]);
    }
  };

  return (
    <div>
      <div className="simulator-header">
        <div className="simulator-badge-row">
          <span className="tag-badge">Module 6</span>
          <span className="badge">Security & Token Mechanics</span>
        </div>
        <h2 className="sim-title">Auth, Sessions & JWT Rotation</h2>
        <p className="sim-desc">
          Short-lived access tokens + HttpOnly SameSite refresh tokens prevent XSS credential theft while enabling stateless horizontal scaling.
        </p>
      </div>

      <div className="control-toolbar">
        <button className="btn btn-primary" onClick={testAuth}>Verify Request Authorization</button>
        <button className={`btn ${isExpired ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setIsExpired(!isExpired)}>
          {isExpired ? 'Access Token: EXPIRED' : 'Simulate Token Expiration'}
        </button>
      </div>

      <div className="vis-grid">
        <div className="vis-card">
          <div className="vis-card-title">Access Token (Memory / Authorization Header)</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isExpired ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            TTL: {isExpired ? '0s (Expired)' : '14m 20s remaining'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>RS256 Asymmetric Signature</p>
        </div>

        <div className="vis-card">
          <div className="vis-card-title">Refresh Token (HttpOnly Cookie)</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-cyan)' }}>
            SameSite=Strict; Secure; HttpOnly
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Inaccessible to document.cookie (XSS immune)</p>
        </div>
      </div>

      <TerminalPane logs={logs} title="Auth Gateway Token State Machine" />
    </div>
  );
};
