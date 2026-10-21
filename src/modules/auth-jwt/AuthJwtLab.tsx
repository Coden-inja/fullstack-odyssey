import React, { useState, useEffect } from 'react';

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
    concept: 'If a malicious script is injected onto your page (XSS), it can read `localStorage.getItem("token")` in one line of code! But browsers physically prevent JavaScript from reading HttpOnly cookies. The browser handles them automatically.',
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
    <div className="lab-split-container">
      {/* LEFT PANEL: Guided Lesson */}
      <div className="guide-panel">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {AUTH_LEVELS.map((lvl, idx) => (
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

          {/* Interactive Controls */}
          {currentLevel.id === 2 && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-outline btn-sm" onClick={handleTamper} style={{ borderColor: '#ef4444', color: '#dc2626' }}>
                Tamper Payload (Change role to "admin")
              </button>
            </div>
          )}

          {currentLevel.id === 3 && (
            <div style={{ marginBottom: 16, background: 'var(--bg-main)', padding: 12, borderRadius: 6, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Storage Location:
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="storage"
                    checked={storageType === 'localStorage'}
                    onChange={() => setStorageType('localStorage')}
                  />
                  localStorage (Vulnerable)
                </label>
                <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="storage"
                    checked={storageType === 'cookie'}
                    onChange={() => setStorageType('cookie')}
                  />
                  HttpOnly Cookie (Protected)
                </label>
              </div>
            </div>
          )}

          <div className="lesson-actions">
            {currentLevel.id !== 3 ? (
              <button className="btn btn-primary btn-sm" onClick={verifySignature}>
                Verify Signature →
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={simulateXss}>
                Simulate XSS Attack →
              </button>
            )}
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You mastered token signatures and cookie security.</div>
            </div>
            {levelIdx < AUTH_LEVELS.length - 1 ? (
              <button className="btn btn-success btn-sm" onClick={() => setLevelIdx(levelIdx + 1)}>
                Next Level →
              </button>
            ) : (
              <span className="badge badge-success">Module Mastered!</span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Token Anatomy Visualizer */}
      <div className="canvas-panel">
        <div className="canvas-header">
          <div>
            <div className="canvas-title">Token Cryptography & Storage Inspector</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              See how the 3 Base64URL parts assemble and how the server checks integrity.
            </div>
          </div>
          <div>
            {verificationResult && (
              <span className={`badge ${verificationResult === 'VALID' ? 'badge-success' : 'badge-danger'}`}>
                {verificationResult === 'VALID' ? 'Signature Verified ✓' : 'Invalid Signature (Tampered) ✕'}
              </span>
            )}
            {xssResult && (
              <span className={`badge ${xssResult === 'BLOCKED' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 6 }}>
                {xssResult === 'BLOCKED' ? 'XSS Neutralized: Cookie Protected' : 'Token Stolen by XSS Script!'}
              </span>
            )}
          </div>
        </div>

        {/* 3-Part Token Wire Representation */}
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
            Encoded JWT Wire String:
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, wordBreak: 'break-all', lineHeight: 1.8 }}>
            <span style={{ color: '#2563eb', background: '#dbeafe', padding: '2px 4px', borderRadius: 4 }}>{headerPart}</span>
            <span style={{ color: '#64748b' }}>.</span>
            <span style={{ color: '#7c3aed', background: '#ede9fe', padding: '2px 4px', borderRadius: 4 }}>{payloadPart}</span>
            <span style={{ color: '#64748b' }}>.</span>
            <span style={{ color: isTampered ? '#dc2626' : '#059669', background: isTampered ? '#fee2e2' : '#d1fae5', padding: '2px 4px', borderRadius: 4 }}>{signaturePart}</span>
          </div>
        </div>

        {/* Decoded Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1 }}>
          <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>1. Header (Algorithm)</div>
            <pre style={{ margin: 0, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2)}
            </pre>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>2. Payload (User Claims)</div>
            <pre style={{ margin: 0, color: isTampered ? '#dc2626' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {JSON.stringify({ sub: 42, role, exp: 1740000000 }, null, 2)}
            </pre>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, color: isTampered ? '#dc2626' : '#059669', marginBottom: 6 }}>3. Signature (HMAC)</div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
              HMACSHA256(
                <br />&nbsp;&nbsp;base64(header) + "." +
                <br />&nbsp;&nbsp;base64(payload),
                <br />&nbsp;&nbsp;server_secret_key
              )
            </div>
            {isTampered && (
              <div style={{ marginTop: 8, color: '#dc2626', fontWeight: 700 }}>
                Signature Mismatch: Math does not match payload!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
