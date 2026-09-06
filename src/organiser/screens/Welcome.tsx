import { Mark } from '../../components/WizardShell';

export function Welcome({ onCreateBooking, onSignIn }: { onCreateBooking: () => void; onSignIn: () => void }) {
  const dots = new Array(18).fill(0);
  return (
    <div className="bs-animate-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Mark size={11} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--bs-label)',
          }}
        >
          BookSlot for educators
        </span>
      </div>
      <h1 className="bs-h1 bs-h1-lg bs-h1-wrap" style={{ marginTop: 22 }}>
        Set your hours once. Let the class book itself.
      </h1>
      <p style={{ margin: '16px 0 0', fontSize: 'clamp(15px,2.6cqw,17px)', lineHeight: 1.55, color: 'var(--bs-ink-soft)', maxWidth: '40ch' }}>
        Consultations, presentations, office hours, parent meetings. One link, no back-and-forth email.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button type="button" className="bs-btn-primary bs-lift" onClick={onCreateBooking}>
          Create booking
        </button>
        <button type="button" className="bs-btn-text" onClick={onSignIn}>
          Sign in
        </button>
      </div>
      <div
        style={{
          marginTop: 'clamp(28px,5cqw,42px)',
          padding: 20,
          border: '1px solid var(--bs-well-border)',
          borderRadius: 14,
          background: 'var(--bs-well)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'clamp(14px,3cqw,24px)',
        }}
      >
        <div style={{ flex: 'none', width: 84 }}>
          <div style={{ width: 30, height: 30, background: 'var(--bs-accent)', borderRadius: 9 }} />
          <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>
            You
          </div>
          <div style={{ marginTop: 3, fontSize: '12.5px', color: 'var(--bs-ink-soft)', lineHeight: 1.35 }}>One window of time</div>
        </div>
        <div style={{ flex: 'none', marginTop: 15, width: 'clamp(16px,4cqw,38px)', height: 1, background: 'var(--bs-line-dash)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(13px,1fr))', gap: 7, maxWidth: 240 }}>
            {dots.map((_, i) => (
              <div
                key={i}
                style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', border: '1.5px solid #d8d0c3', background: 'var(--bs-sheet)' }}
              />
            ))}
          </div>
          <div style={{ marginTop: 13, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>
            Your class
          </div>
          <div style={{ marginTop: 3, fontSize: '12.5px', color: 'var(--bs-ink-soft)', lineHeight: 1.4 }}>
            Each student or group takes one slot, and it disappears for everyone else
          </div>
        </div>
      </div>
    </div>
  );
}
