import React, { useState, useEffect } from 'react';
import { TerminalPane, LogEntry } from '../../components/TerminalPane';

export const AuthJwtLab: React.FC = () => {
  const [role, setRole] = useState<'developer' | 'admin' | 'root'>('developer');
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [storageType, setStorageType] = useState<'localStorage' | 'httpOnlyCookie'>('httpOnlyCookie');
  const [sameSiteMode, setSameSiteMode] = useState<'None' | 'Lax' | 'Strict'>('Strict');
  const [refreshRotations, setRefreshRotations] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Challenge checks
  const [achievedTamperDetected, setAchievedTamperDetected] = useState<boolean>(false);
  const [achievedRefreshRotation, setAchievedRefreshRotation] = useState<boolean>(false);
  const [achievedCsrfProtection, setAchievedCsrfProtection] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', text: 'Auth0/Jose crypto engine initialized (HMAC-SHA256 & RS256).' },
    { id: '2', type: 'output', text: 'Interactive JWT token editor and browser storage security model active.' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved && JSON.parse(saved).includes('auth-jwt')) {
        setIsCompleted(true);
      }
    } catch {}
  }, []);

  // Compute Base64URL parts
  const headerObj = { alg: 'HS256', typ: 'JWT' };
  const payloadObj = {
    sub: 'usr_849201',
    name: 'Yogesh K.',
    role: role,
    iat: Math.floor(Date.now() / 1000) - 300,
    exp: tokenExpired ? Math.floor(Date.now() / 1000) - 60 : Math.floor(Date.now() / 1000) + 900
  };

  const headerB64 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payloadB64 = btoa(JSON.stringify(payloadObj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const validSignatureB64 = 'k8Z2b9Qx01M8x_qPL41sZ80eKaL9_3uW';
  const signatureB64 = isTampered ? 'TAMPERED_INVALID_SIG_991823' : validSignatureB64;

  const rawJwt = `${headerB64}.${payloadB64}.${signatureB64}`;

  const verifySignature = () => {
    const timestamp = Date.now();
    if (isTampered) {
      setAchievedTamperDetected(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `crypto.verify(token, HMAC_SECRET_KEY)` },
        { id: (timestamp + 1).toString(), type: 'error', text: `🚨 CRYPTOGRAPHIC REJECTION: Signature mismatch! Payload was modified in-flight without secret key.` }
      ]);
      return;
    }

    if (tokenExpired) {
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `crypto.verify(token, HMAC_SECRET_KEY)` },
        { id: (timestamp + 1).toString(), type: 'error', text: `⚠️ SIGNATURE VALID, BUT TOKEN EXPIRED (exp: ${payloadObj.exp} < current_time)` },
        { id: (timestamp + 2).toString(), type: 'output', text: `Client triggering silent refresh via POST /api/auth/refresh...` }
      ]);
      triggerSilentRefresh();
      return;
    }

    setLogs(p => [
      ...p,
      { id: timestamp.toString(), type: 'system', text: `crypto.verify(token, HMAC_SECRET_KEY)` },
      { id: (timestamp + 1).toString(), type: 'success', text: `✓ Signature verified! Authenticated subject: usr_849201 with role '${role}'.` }
    ]);
  };

  const triggerSilentRefresh = () => {
    setTokenExpired(false);
    setIsTampered(false);
    setRefreshRotations(r => r + 1);
    setAchievedRefreshRotation(true);
    setLogs(p => [
      ...p,
      { id: Date.now().toString(), type: 'success', text: `✓ Silent Refresh Success! Issued new 15-minute Access Token & rotated refresh token secret.` }
    ]);
  };

  const simulateCsrfAttack = () => {
    const timestamp = Date.now();
    if (storageType === 'localStorage') {
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'output', text: `Attacker site (evil.com) fires cross-site request...` },
        { id: (timestamp + 1).toString(), type: 'success', text: `✓ LocalStorage is immune to automated ambient CSRF cookie inclusion! But vulnerable to XSS.` }
      ]);
      return;
    }

    if (sameSiteMode === 'Strict') {
      setAchievedCsrfProtection(true);
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `Browser processing cross-origin POST from evil.com...` },
        { id: (timestamp + 1).toString(), type: 'success', text: `🛡️ CSRF BLOCKED: SameSite=Strict refused to attach session cookie on cross-site dispatch.` }
      ]);
    } else if (sameSiteMode === 'Lax') {
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `Browser processing cross-origin POST from evil.com...` },
        { id: (timestamp + 1).toString(), type: 'success', text: `🛡️ CSRF BLOCKED: SameSite=Lax blocks ambient cookies on non-idempotent POST requests.` }
      ]);
    } else {
      setLogs(p => [
        ...p,
        { id: timestamp.toString(), type: 'system', text: `Browser processing cross-origin POST from evil.com...` },
        { id: (timestamp + 1).toString(), type: 'error', text: `🔥 CSRF EXPLOIT SUCCEEDED: SameSite=None attached ambient auth cookie! Unauthorized state mutation occurred.` }
      ]);
    }
  };

  const markModuleCompleted = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('auth-jwt')) {
        list.push('auth-jwt');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
      setIsCompleted(true);
      setLogs(p => [
        ...p,
        { id: Date.now().toString(), type: 'success', text: '✓ Module 06 (Auth, JWT & Cookies) marked as Completed in local storage!' }
      ]);
    } catch {}
  };

  return (
    <>
      <div className="lab-panel-left">
        {/* Quest Story */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Quest: The In-Flight Signature & CSRF Boundary</span>
            <span className="badge badge-indigo">Module 06</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            A JSON Web Token (RFC 7519) is a stateless, cryptographically signed assertion consisting of 3 parts:
            <code style={{ color: 'var(--rose)' }}> Header</code>,
            <code style={{ color: 'var(--purple)' }}> Payload</code>, and
            <code style={{ color: 'var(--cyan)' }}> Signature</code>.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            <strong>Security Invariant:</strong> The payload is Base64URL encoded (plain text visible to anyone), NOT encrypted!
            Integrity relies entirely on the HMAC/RSA signature.
          </p>
        </div>

        {/* Token Manipulator */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>JWT Claims Configurator</span>
            <span className={`badge ${isTampered ? 'badge-rose' : 'badge-emerald'}`}>
              {isTampered ? 'Tampered' : 'Signed'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Role Claim (Payload Mutation):</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                {(['developer', 'admin', 'root'] as const).map(r => (
                  <button
                    key={r}
                    className={`btn ${role === r ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setRole(r);
                      if (r !== 'developer') setIsTampered(true);
                    }}
                    style={{ fontSize: 11, padding: '6px 8px', justifyContent: 'center' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn ${tokenExpired ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setTokenExpired(!tokenExpired)}
                style={{ flex: 1, fontSize: 11, justifyContent: 'center' }}
              >
                {tokenExpired ? 'Expiration: Expired' : 'Simulate Expired Token'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsTampered(!isTampered);
                  setLogs(p => [
                    ...p,
                    { id: Date.now().toString(), type: 'system', text: isTampered ? 'Restored valid cryptographic signature.' : 'Tampered token payload without updating cryptographic signature!' }
                  ]);
                }}
                style={{ flex: 1, fontSize: 11, justifyContent: 'center' }}
              >
                {isTampered ? 'Restore Valid Signature' : 'Tamper Payload (Simulate Attack)'}
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={verifySignature}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              ▶ Verify Token Signature
            </button>
          </div>
        </div>

        {/* Storage Security Architecture (Cookie vs LocalStorage) */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Storage Vector: XSS vs CSRF</span>
            <span className="badge badge-indigo">{storageType}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className={`btn ${storageType === 'httpOnlyCookie' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setStorageType('httpOnlyCookie')}
              style={{ flex: 1, fontSize: 11, justifyContent: 'center' }}
            >
              HttpOnly Cookie (XSS Safe)
            </button>
            <button
              className={`btn ${storageType === 'localStorage' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setStorageType('localStorage')}
              style={{ flex: 1, fontSize: 11, justifyContent: 'center' }}
            >
              LocalStorage (XSS Vulnerable)
            </button>
          </div>

          {storageType === 'httpOnlyCookie' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>SameSite Cookie Flag:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                {(['Strict', 'Lax', 'None'] as const).map(mode => (
                  <button
                    key={mode}
                    className={`btn ${sameSiteMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSameSiteMode(mode)}
                    style={{ fontSize: 10, padding: '6px 4px', justifyContent: 'center' }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={simulateCsrfAttack}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            ⚡ Test CSRF Cross-Origin Attack
          </button>
        </div>

        {/* Challenge Mastery Card */}
        <div className="lab-card">
          <div className="lab-card-title">
            <span>Security Engineering Checklist</span>
            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-indigo'}`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedTamperDetected ? '✅' : '⏳'}</span>
              <span>Trigger cryptographic signature rejection on tampered payload</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedRefreshRotation ? '✅' : '⏳'}</span>
              <span>Execute silent token refresh on expired token</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{achievedCsrfProtection ? '✅' : '⏳'}</span>
              <span>Block CSRF cross-origin attack via SameSite=Strict cookie</span>
            </div>
          </div>

          <button
            className={`btn ${isCompleted ? 'btn-success' : achievedTamperDetected && achievedRefreshRotation ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!achievedTamperDetected || !achievedRefreshRotation}
            onClick={markModuleCompleted}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isCompleted ? '✓ Module 06 Mastered (Completed)' : 'Mark Module as Done →'}
          </button>
        </div>

        <TerminalPane logs={logs} title="Crypto & Auth Audit Trace" />
      </div>

      {/* Right Column: JWT 3-Part Raw String & Decoded Claims */}
      <div className="lab-panel-right">
        <div className="canvas-card">
          <div className="lab-card-title">
            <span>JWT.io Cryptographic Wire Anatomy</span>
            <span className="badge badge-emerald">Algorithm: HS256</span>
          </div>

          {/* Raw Colored JWT string */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            wordBreak: 'break-all',
            padding: '14px 18px',
            background: '#040711',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            lineHeight: 1.6,
            marginBottom: 20
          }}>
            <span style={{ color: 'var(--rose)' }}>{headerB64}</span>.
            <span style={{ color: 'var(--purple)' }}>{payloadB64}</span>.
            <span style={{ color: isTampered ? 'var(--rose)' : 'var(--cyan)' }}>{signatureB64}</span>
          </div>

          {/* 3-Box Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {/* Header Box */}
            <div className="lab-card" style={{ background: '#040711', borderTop: '3px solid var(--rose)' }}>
              <strong style={{ fontSize: 12, color: 'var(--rose)' }}>Header (Meta)</strong>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a5b4fc', marginTop: 8 }}>
                {JSON.stringify(headerObj, null, 2)}
              </pre>
            </div>

            {/* Payload Box */}
            <div className="lab-card" style={{ background: '#040711', borderTop: '3px solid var(--purple)' }}>
              <strong style={{ fontSize: 12, color: 'var(--purple)' }}>Payload (Claims)</strong>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a5b4fc', marginTop: 8 }}>
                {JSON.stringify(payloadObj, null, 2)}
              </pre>
            </div>

            {/* Signature Box */}
            <div className="lab-card" style={{ background: '#040711', borderTop: `3px solid ${isTampered ? 'var(--rose)' : 'var(--cyan)'}` }}>
              <strong style={{ fontSize: 12, color: isTampered ? 'var(--rose)' : 'var(--cyan)' }}>
                {isTampered ? 'Invalid Signature' : 'HMAC Signature'}
              </strong>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                {isTampered
                  ? 'MISMATCH: The server computed signature does not match this token.'
                  : 'VALID: Computed via HMAC-SHA256(Base64(Header) + "." + Base64(Payload), SECRET_KEY).'}
              </p>
            </div>
          </div>

          {/* Storage Matrix */}
          <div className="lab-card" style={{ background: '#040711' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, color: '#fff' }}>Client Storage Security Matrix</strong>
              <span className="badge">OWASP Guidelines</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>XSS Attack Surface:</span>
                <strong style={{ display: 'block', color: storageType === 'httpOnlyCookie' ? 'var(--emerald)' : 'var(--rose)', marginTop: 2 }}>
                  {storageType === 'httpOnlyCookie' ? '✓ Immune (HttpOnly)' : '🔥 Vulnerable'}
                </strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>CSRF Attack Surface:</span>
                <strong style={{ display: 'block', color: storageType === 'localStorage' || sameSiteMode === 'Strict' ? 'var(--emerald)' : sameSiteMode === 'Lax' ? 'var(--amber)' : 'var(--rose)', marginTop: 2 }}>
                  {storageType === 'localStorage' ? '✓ N/A (Manual Header)' : sameSiteMode === 'Strict' ? '✓ Immune (Strict)' : sameSiteMode === 'Lax' ? 'Moderate (Lax)' : '🔥 Vulnerable (None)'}
                </strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Rotations Logged:</span>
                <strong style={{ display: 'block', color: 'var(--cyan)', marginTop: 2 }}>
                  {refreshRotations} Rotations
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
