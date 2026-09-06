import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BareShell } from '../components/WizardShell';
import { signIn, signUp } from '../lib/auth';

export default function AuthScreen() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { next?: string } };
  const next = location.state?.next || '/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate(next, { replace: true });
      } else {
        await signUp(email, password);
        setCheckEmail(true);
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
            <button type="button" className="bs-btn-primary" onClick={() => { setMode('signin'); setCheckEmail(false); }}>
              Back to sign in
            </button>
          </div>
        </div>
      </BareShell>
    );
  }

  return (
    <BareShell>
      <div className="bs-animate-up">
        <h1 className="bs-h1 bs-h1-sm">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h1>
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
        </div>

        {error && <p style={{ margin: '14px 0 0', fontSize: '13.5px', color: '#b00020' }}>{error}</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
          <button type="button" className="bs-btn-primary" onClick={submit} disabled={busy || !email || password.length < 6}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" className="bs-btn-text" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </BareShell>
  );
}
