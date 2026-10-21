import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface AuthLevel {
  id: number;
  title: string;
  subtitle: string;
  story: string;
  concept: string;
  goalDescription: string;
  hint: string;
  initialRole: string;
  storageTarget: 'localStorage' | 'cookie';
  expectedTamperState: boolean;
}

const AUTH_LEVELS: AuthLevel[] = [
  {
    id: 1,
    title: 'Level 1: The Anatomy of a Token',
    subtitle: 'Header, Payload & Digital Signature',
    story: 'When you log in to an app, the server gives you a digital badge called a JWT. It proves who you are without requiring you to re-type your password on every page click.',
    concept: 'A JWT has 3 parts separated by dots: Header (the algorithm), Payload (your user ID, role, and expiration date), and Signature (a cryptographic seal created with the server secret).',
    goalDescription: 'Click "Verify Signature" on the legitimate token to confirm the cryptographic signature matches.',
    hint: 'Click "Verify Signature" to see the server validate the signature.',
    initialRole: 'member',
    storageTarget: 'localStorage',
    expectedTamperState: false
  },
  {
    id: 2,
    title: 'Level 2: Catching a Tampered Token',
    subtitle: 'Why Hackers Cannot Fake an Admin Role',
    story: 'What happens if a user opens Developer Tools, changes their token payload from "member" to "admin", and sends it to the server?',
    concept: 'Because the user does not know the server’s secret key, modifying the payload changes the math. When the server re-computes the HMAC signature, it sees a mismatch and immediately throws INVALID_SIGNATURE!',
    goalDescription: 'Change Role to "admin" or click "Tamper Payload", then click "Verify Signature" to watch the security detector catch the alteration.',
    hint: 'Click "Tamper Payload (role: admin)" and then click "Verify Signature".',
    initialRole: 'member',
    storageTarget: 'localStorage',
    expectedTamperState: true
  },
  {
    id: 3,
    title: 'Level 3: The Cookie Shield',
    subtitle: 'Why HttpOnly Cookies Stop Token Theft (XSS)',
    story: 'Why do security engineers insist on storing tokens in HttpOnly cookies instead of localStorage?',
    concept: 'If a malicious script is injected onto your page (XSS), it can read localStorage.getItem("token") in one line of code! But browsers physically prevent JavaScript from reading HttpOnly cookies. The browser handles them automatically.',
    goalDescription: 'Switch token storage to "HttpOnly Cookie", click "Simulate XSS Attack", and watch the browser block the script from stealing your credentials.',
    hint: 'Select HttpOnly Cookie and run the XSS simulation.',
    initialRole: 'member',
    storageTarget: 'cookie',
    expectedTamperState: false
  }
];

export const AuthJwtLab: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const currentLevel = AUTH_LEVELS[levelIdx];

  const [role, setRole] = useState<string>(currentLevel.initialRole);
  const [storageType, setStorageType] = useState<'localStorage' | 'cookie'>(currentLevel.storageTarget);
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [xssResult, setXssResult] = useState<string | null>(null);

  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    if (!levelWon) {
      if (currentLevel.id === 1 && verificationResult === 'VALID') {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 2 && verificationResult === 'INVALID') {
        setLevelWon(true);
        saveModuleCompletion();
      } else if (currentLevel.id === 3 && xssResult === 'BLOCKED') {
        setLevelWon(true);
        saveModuleCompletion();
      }
    }
  }, [verificationResult, xssResult, levelWon, currentLevel]);

  const saveModuleCompletion = () => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes('auth-jwt')) {
        list.push('auth-jwt');
        localStorage.setItem('odyssey_completed_modules', JSON.stringify(list));
      }
    } catch {}
  };

  const resetLevel = (idx: number) => {
    const l = AUTH_LEVELS[idx];
    setRole(l.initialRole);
    setStorageType(l.storageTarget);
    setIsTampered(false);
    setVerificationResult(null);
    setXssResult(null);
    setShowHint(false);
    setLevelWon(false);
  };

  const handleTamper = () => {
    setRole('admin');
    setIsTampered(true);
    setVerificationResult(null);
  };

  const verifySignature = () => {
    if (isTampered || role === 'admin') {
      setVerificationResult('INVALID');
    } else {
      setVerificationResult('VALID');
    }
  };

  const simulateXss = () => {
    if (storageType === 'localStorage') {
      setXssResult('STOLEN');
    } else {
      setXssResult('BLOCKED');
    }
  };

  const autoPlaySolution = () => {
    if (currentLevel.id === 1) {
      verifySignature();
    } else if (currentLevel.id === 2) {
      handleTamper();
      setTimeout(() => verifySignature(), 300);
    } else if (currentLevel.id === 3) {
      setStorageType('cookie');
      setTimeout(() => simulateXss(), 300);
    }
  };

  const headerPart = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payloadPart = btoa(JSON.stringify({ sub: 42, role, exp: 1740000000 }));
  const signaturePart = isTampered ? 'tampered_fake_signature_98x1' : 'valid_hmac_secret_seal_88a4';

  return (
    <div className="lab-interactive-top-layout">
      {/* 1. TOP SECTION: Visual JWT Anatomy & Companion Auth Controls */}
      <div className="lab-workbench-top">
        <div className="lab-workbench-grid">
          {/* LEFT: Live JWT Token Anatomy & Storage Jar */}
          <div className="workbench-main-visual">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div className="canvas-title" style={{ fontSize: 16, marginBottom: 2 }}>
                  JWT Token Cryptographic Anatomy
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Color-coded Header (Red), Claims Payload (Purple), and HMAC-SHA256 Signature (Cyan).
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-indigo">HS256</span>
                <span className="badge">{storageType === 'cookie' ? 'HttpOnly Cookie' : 'localStorage'}</span>
              </div>
            </div>

            {/* Formatted Token String */}
            <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all', lineHeight: 1.6 }}>
              <span style={{ color: '#f87171' }}>{headerPart}</span>
              <span style={{ color: '#94a3b8' }}>.</span>
              <span style={{ color: '#c084fc' }}>{payloadPart}</span>
              <span style={{ color: '#94a3b8' }}>.</span>
              <span style={{ color: '#38bdf8' }}>{signaturePart}</span>
            </div>

            {/* Decoded Claims Inspector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', marginBottom: 4 }}>Decoded Payload Claims:</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                  <div>sub: 42</div>
                  <div style={{ fontWeight: 700, color: role === 'admin' ? '#dc2626' : 'var(--text-main)' }}>role: "{role}"</div>
                  <div>exp: 1740000000</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Client Storage Location:</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Target: <strong>{storageType}</strong>
                </div>
                <div style={{ fontSize: 11, color: storageType === 'cookie' ? '#059669' : '#dc2626', marginTop: 4 }}>
                  {storageType === 'cookie' ? '✓ Protected against JavaScript XSS extraction' : '⚠ Vulnerable to document.cookie / localStorage theft'}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Objectives, Bullets, Compact Auth Terminal & Actions */}
          <div className="workbench-side-panel">
            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {AUTH_LEVELS.map((lvl, idx) => (
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
                  <button className="btn btn-primary btn-sm" onClick={verifySignature} style={{ fontSize: 11, padding: '4px 10px' }}>
                    Verify Signature
                  </button>
                )}
                {currentLevel.id === 2 && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={handleTamper} style={{ fontSize: 11, padding: '4px 8px' }}>
                      Tamper (role: admin)
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={verifySignature} style={{ fontSize: 11, padding: '4px 10px' }}>
                      Verify Signature
                    </button>
                  </>
                )}
                {currentLevel.id === 3 && (
                  <>
                    <button
                      className={`btn btn-sm ${storageType === 'cookie' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setStorageType('cookie')}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Use HttpOnly Cookie
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={simulateXss} style={{ fontSize: 11, padding: '4px 8px' }}>
                      Simulate XSS Attack
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

            {/* Compact Authentic macOS Auth Terminal */}
            <div className="terminal-window" style={{ minHeight: 140 }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="terminal-title" style={{ fontSize: 10.5 }}>
                  <TerminalIcon size={11} style={{ color: '#38bdf8' }} />
                  AUTH CRYPTOGRAPHIC VALIDATOR
                </span>
                <div style={{ width: 28 }} />
              </div>

              <div className="terminal-body" style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11.5, padding: '8px 10px' }}>
                {!verificationResult && !xssResult ? (
                  <div style={{ color: '#71717a', fontStyle: 'italic' }}>
                    Awaiting verification check or XSS injection test...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {verificationResult && (
                      <div className="terminal-line" style={{ color: verificationResult === 'VALID' ? '#4ade80' : '#f87171' }}>
                        <span className="glyph">{verificationResult === 'VALID' ? '✓' : '✗'}</span>
                        <span>HMAC-SHA256: {verificationResult === 'VALID' ? 'Signature verified against secret' : 'Signature mismatch! FORGED_TOKEN_REJECTED'}</span>
                      </div>
                    )}
                    {xssResult && (
                      <div className="terminal-line" style={{ color: xssResult === 'BLOCKED' ? '#4ade80' : '#f87171' }}>
                        <span className="glyph">{xssResult === 'BLOCKED' ? '✓' : '✗'}</span>
                        <span>XSS Probe: {xssResult === 'BLOCKED' ? 'HttpOnly flag blocked document.cookie read' : 'localStorage token stolen by attacker script!'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Level Completion Status */}
            {levelWon && (
              <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 12 }}>Level Completed!</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You mastered token cryptographic security.</div>
                </div>
                {levelIdx < AUTH_LEVELS.length - 1 ? (
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
        {/* Left Card: JWT Cryptographic Architecture */}
        <div className="lesson-objective-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: 4 }}>
            Cryptographic Authentication
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            Digital Signatures &amp; HMAC Verification
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.concept}
          </p>

          <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>HMAC-SHA256 Math:</div>
            <div>Signature = Base64URL( HMAC_SHA256( secretKey, header + "." + payload ) )</div>
            <div style={{ color: '#94a3b8', marginTop: 4 }}>Because secretKey never leaves the server, an attacker who alters the payload produces an unrecognizable signature.</div>
          </div>
        </div>

        {/* Right Card: Production Incident Story */}
        <div className="lesson-concepts-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: 4 }}>
            Production War Story
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'var(--text-main)' }}>
            The "alg: none" Elevation Exploit
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {currentLevel.story}
          </p>

          <div style={{ background: 'var(--bento-peach-bg)', border: '1.5px solid var(--bento-peach-border)', padding: 12, borderRadius: 10, fontSize: 12.5, color: 'var(--bento-peach-text)', lineHeight: 1.5 }}>
            <strong>Systems Invariant: </strong> Never trust client tokens without signature verification. Vulnerable JWT libraries that accepted the `none` algorithm allowed attackers to forge admin badges with empty signatures, granting total root access.
          </div>
        </div>
      </div>
    </div>
  );
};
