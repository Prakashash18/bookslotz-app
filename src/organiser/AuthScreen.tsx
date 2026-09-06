import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BareShell } from '../components/WizardShell';
import { resetPassword, signIn, signUp } from '../lib/auth';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { next?: string } };
  const next = location.state?.next || '/dashboard';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate(next, { replace: true });
      } else if (mode === 'signup') {
        await signUp(email, password);
        setCheckEmail(true);
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">Check your email</h1>
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and sign in.
          </p>
          <div style={{ marginTop: 24 }}>
            <button type="button" className="bs-btn-primary" onClick={() => { switchMode('signin'); setCheckEmail(false); }}>
              Back to sign in
            </button>
          </div>
        </div>
      </BareShell>
    );
  }

  if (resetSent) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">Check your email</h1>
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>
            If <strong>{email}</strong> has an account, we sent a link to reset its password. Click it to choose a
            new one.
          </p>
          <div style={{ marginTop: 24 }}>
            <button type="button" className="bs-btn-primary" onClick={() => { switchMode('signin'); setResetSent(false); }}>
              Back to sign in
            </button>
          </div>
        </div>
      </BareShell>
    );
  }

  const title = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your account' : 'Reset your password';
  const canSubmit = mode === 'forgot' ? !!email : !!email && password.length >= 6;

  return (
    <BareShell>
      <div className="bs-animate-up">
        <h1 className="bs-h1 bs-h1-sm">{title}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 'clamp(24px,5cqw,32px)', maxWidth: 380 }}>
          <label style={{ display: 'block' }}>
            <span className="bs-field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="bs-input"
              style={{ fontSize: 16 }}
            />
          </label>
          {mode !== 'forgot' && (
            <label style={{ display: 'block' }}>
              <span className="bs-field-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="bs-input"
                style={{ fontSize: 16 }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </label>
          )}
        </div>

        {mode === 'signin' && (
          <button
            type="button"
            className="bs-btn-text-tight"
            style={{ marginTop: 10, padding: 0 }}
            onClick={() => switchMode('forgot')}
          >
            Forgot password?
          </button>
        )}

        {error && <p style={{ margin: '14px 0 0', fontSize: '13.5px', color: '#b00020' }}>{error}</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
          <button type="button" className="bs-btn-primary" onClick={submit} disabled={busy || !canSubmit}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
          {mode === 'forgot' ? (
            <button type="button" className="bs-btn-text" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          ) : (
            <button type="button" className="bs-btn-text" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          )}
        </div>
      </div>
    </BareShell>
  );
}
