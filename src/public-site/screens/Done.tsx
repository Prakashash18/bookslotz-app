export function Done({
  pickedDayLong,
  pickedRange,
  location,
  sendEmail,
  bookerEmail,
  onManage,
}: {
  pickedDayLong: string;
  pickedRange: string;
  location: string;
  sendEmail: boolean;
  bookerEmail: string;
  onManage: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <div className="bs-animate-pop" style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bs-accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
        ✓
      </div>
      <h1 className="bs-h1" style={{ marginTop: 20 }}>You're booked</h1>
      <div style={{ marginTop: 'clamp(20px,4cqw,26px)', padding: '18px 20px', border: '1px solid var(--bs-well-border)', borderRadius: 13, background: 'var(--bs-well)' }}>
        <div style={{ fontSize: 'clamp(19px,3.8cqw,23px)', fontWeight: 600, letterSpacing: '-0.01em' }}>{pickedDayLong}</div>
        <div style={{ marginTop: 4, fontSize: 16, color: 'var(--bs-ink-soft)' }}>{pickedRange}</div>
        <div style={{ marginTop: 4, fontSize: 14, color: 'var(--bs-label)' }}>{location}</div>
      </div>
      {sendEmail && (
        <p style={{ margin: '18px 0 0', fontSize: '14.5px', lineHeight: 1.6, color: 'var(--bs-label)' }}>
          A confirmation email has been sent to
          <br />
          <span style={{ color: 'var(--bs-ink)', fontWeight: 500 }}>{bookerEmail}</span>, with a link to change this time.
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
        <button type="button" className="bs-btn-primary" disabled>
          Add to calendar
        </button>
        <button type="button" className="bs-btn-text" onClick={onManage}>
          Change my booking
        </button>
      </div>
    </div>
  );
}
