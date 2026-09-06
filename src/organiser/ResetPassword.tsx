import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BareShell } from '../components/WizardShell';
import { updatePassword, useSession } from '../lib/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <BareShell>
        <div style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>Loading…</div>
      </BareShell>
    );
  }

  if (done) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">Password updated</h1>
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>You're all set.</p>
          <div style={{ marginTop: 24 }}>
            <button type="button" className="bs-btn-primary" onClick={() => navigate('/dashboard')}>
              Go to your events
            </button>
          </div>
        </div>
      </BareShell>
    );
  }

  if (!session) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">This reset link isn't valid</h1>
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>
            It may have expired or already been used. Request a new one from the sign-in page.
          </p>
          <div style={{ marginTop: 24 }}>
            <button type="button" className="bs-btn-primary" onClick={() => navigate('/login')}>
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
        <h1 className="bs-h1 bs-h1-sm">Choose a new password</h1>
        <div style={{ marginTop: 'clamp(24px,5cqw,32px)', maxWidth: 380 }}>
          <label style={{ display: 'block' }}>
            <span className="bs-field-label">New password</span>
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
        <div style={{ marginTop: 'clamp(24px,5cqw,32px)' }}>
          <button type="button" className="bs-btn-primary" onClick={submit} disabled={busy || password.length < 6}>
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </div>
      </div>
    </BareShell>
  );
}
