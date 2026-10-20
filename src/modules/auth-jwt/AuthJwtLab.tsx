import React, { useState } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const AuthJwtLab: React.FC = () => {
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  const [rotatedCount, setRotatedCount] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Auth Service: RS256 Public/Private keypair loaded.' },
    { id: '2', type: 'output', text: 'HttpOnly Secure SameSite=Strict cookie established.' }
  ]);

  const headerB64 = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";
  const payloadB64 = tokenExpired 
    ? "eyJzdWIiOiJ1c3JfOTkiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE2MDAwMDAwMDB9" 
    : "eyJzdWIiOiJ1c3JfOTkiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE5MDAwMDAwMDB9";
  const signatureB64 = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

  const verifyToken = () => {
    if (tokenExpired) {
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'error', text: 'Signature verified, but token is EXPIRED (exp claim in past).' },
        { id: (Date.now() + 1).toString(), type: 'output', text: 'Dispatching POST /api/auth/refresh with HttpOnly Cookie...' },
        { id: (Date.now() + 2).toString(), type: 'success', text: 'Silent Refresh Success! Issued new 15m Access Token & rotated refresh token.' }
      ]);
      setTokenExpired(false);
      setRotatedCount(c => c + 1);
    } else {
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: 'RS256 Signature verified against Public Key! Identity: usr_99 (admin).' }
      ]);
    }
  };

  return (
    <>
      <div className="lab-panel-left">
        <div className="lab-card">
          <div className="lab-card-title">Token Controls</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={verifyToken}>
              Verify Access Token
            </button>
            <button 
              className={`btn ${tokenExpired ? 'btn-danger' : 'btn-secondary'}`} 
              onClick={() => setTokenExpired(!tokenExpired)}
            >
              {tokenExpired ? 'State: EXPIRED' : 'Simulate Expiration'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            Rotations executed: <strong>{rotatedCount}</strong>
          </p>
        </div>

        <div className="lab-card">
          <div className="lab-card-title">Cookie Storage Protection Flags</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6 }}>
              <span>HttpOnly: true</span>
              <span style={{ color: 'var(--emerald)' }}>XSS Immune</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6 }}>
              <span>Secure: true</span>
              <span style={{ color: 'var(--emerald)' }}>TLS Only</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6 }}>
              <span>SameSite: Strict</span>
              <span style={{ color: 'var(--emerald)' }}>CSRF Immune</span>
            </div>
          </div>
        </div>

        <TerminalPane logs={logs} title="Auth Microservice Audit Log" />
      </div>

      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>JWT.io 3-Part Cryptographic Anatomy</span>
            <span className="badge badge-indigo">RS256 Asymmetric</span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, wordBreak: 'break-all', padding: 16, background: '#030509', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
            <span style={{ color: 'var(--rose)' }}>{headerB64}</span>.
            <span style={{ color: 'var(--purple)' }}>{payloadB64}</span>.
            <span style={{ color: 'var(--cyan)' }}>{signatureB64}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div className="lab-card" style={{ borderTop: '3px solid var(--rose)' }}>
              <strong style={{ color: 'var(--rose)', fontSize: 12 }}>Header</strong>
              <pre style={{ fontSize: 11, color: '#cbd5e1', marginTop: 6 }}>
{JSON.stringify({ alg: "RS256", typ: "JWT" }, null, 2)}
              </pre>
            </div>

            <div className="lab-card" style={{ borderTop: '3px solid var(--purple)' }}>
              <strong style={{ color: 'var(--purple)', fontSize: 12 }}>Payload Claims</strong>
              <pre style={{ fontSize: 11, color: '#cbd5e1', marginTop: 6 }}>
{JSON.stringify({ sub: "usr_99", role: "admin", exp: tokenExpired ? 1600000000 : 1900000000 }, null, 2)}
              </pre>
            </div>

            <div className="lab-card" style={{ borderTop: '3px solid var(--cyan)' }}>
              <strong style={{ color: 'var(--cyan)', fontSize: 12 }}>Signature Verification</strong>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                SHA-256 with RSA 2048-bit Private Key. Verified via public key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
