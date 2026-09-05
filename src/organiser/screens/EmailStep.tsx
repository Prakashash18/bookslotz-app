import { dm, fmtT, wk, type Slot } from '../../lib/slots';

export function EmailStep({
  title,
  location,
  sendEmail,
  sampleSlot,
  onYes,
  onNo,
  onContinue,
}: {
  title: string;
  location: string;
  sendEmail: boolean;
  sampleSlot: Slot | null;
  onYes: () => void;
  onNo: () => void;
  onContinue: () => void;
}) {
  const sampleDay = sampleSlot ? `${wk(sampleSlot.date)}, ${dm(sampleSlot.date)}` : '';
  const sampleTime = sampleSlot ? `${fmtT(sampleSlot.start)} – ${fmtT(sampleSlot.end)}` : '';

  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">Send a confirmation email?</h1>
      <div style={{ marginTop: 'clamp(22px,5cqw,30px)', background: '#fff', border: '1px solid var(--bs-line-soft)', borderRadius: 13, overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--bs-line-softer)', fontSize: 12, color: 'var(--bs-label)' }}>
          To: student@example.edu
        </div>
        <div style={{ padding: '20px 18px 22px' }}>
          <div style={{ fontSize: '15.5px', fontWeight: 600 }}>You're booked — {title}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 14, color: 'var(--bs-ink-soft)' }}>
            <div>{sampleDay}</div>
            <div>{sampleTime}</div>
            <div>{location}</div>
          </div>
          <div style={{ marginTop: 16, height: 9, width: '74%', background: 'var(--bs-line-softer)', borderRadius: 5 }} />
          <div style={{ marginTop: 7, height: 9, width: '52%', background: 'var(--bs-line-softer)', borderRadius: 5 }} />
          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ padding: '8px 14px', background: 'var(--bs-accent-wash-strong)', color: 'var(--bs-accent-text-strong)', borderRadius: 7, fontSize: '12.5px', fontWeight: 600 }}>
              Add to calendar
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--bs-label)', textDecoration: 'underline' }}>Change or cancel</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 18 }}>
        <button type="button" className={`bs-choice${sendEmail ? ' is-on' : ''}`} onClick={onYes}>
          Yes, send confirmation
        </button>
        <button type="button" className={`bs-choice${!sendEmail ? ' is-on' : ''}`} onClick={onNo}>
          No email
        </button>
      </div>

      {sendEmail && (
        <p style={{ margin: '14px 0 0', fontSize: '13.5px', color: 'var(--bs-label)', lineHeight: 1.5 }}>
          Students receive their date, time and room automatically.
        </p>
      )}

      <div style={{ marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
