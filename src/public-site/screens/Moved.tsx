export function Moved({
  prevDayLong,
  prevRange,
  nowDayLong,
  nowRange,
  bookerEmail,
  onView,
}: {
  prevDayLong: string;
  prevRange: string;
  nowDayLong: string;
  nowRange: string;
  bookerEmail: string;
  onView: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <div className="bs-animate-pop" style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bs-accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
        ✓
      </div>
      <h1 className="bs-h1" style={{ marginTop: 20 }}>Your time has moved</h1>
      <div style={{ marginTop: 'clamp(20px,4cqw,26px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: '0 1 190px', minWidth: 0, padding: '14px 16px', border: '1px dashed var(--bs-line-dash)', borderRadius: 12, color: 'var(--bs-label)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Was</div>
          <div style={{ marginTop: 4, fontSize: '14.5px', textDecoration: 'line-through' }}>{prevDayLong}</div>
          <div style={{ fontSize: '14.5px', textDecoration: 'line-through' }}>{prevRange}</div>
        </div>
        <div style={{ flex: '0 1 190px', minWidth: 0, padding: '14px 16px', border: '1.5px solid var(--bs-accent)', borderRadius: 12, background: 'var(--bs-accent-wash)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bs-accent-text-strong)' }}>Now</div>
          <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>{nowDayLong}</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{nowRange}</div>
        </div>
      </div>
      <p style={{ margin: '18px 0 0', fontSize: '14.5px', lineHeight: 1.6, color: 'var(--bs-label)' }}>
        Your old slot is open again for the rest of the class. An updated email is on its way to{' '}
        <span style={{ color: 'var(--bs-ink)', fontWeight: 500 }}>{bookerEmail}</span>.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
        <button type="button" className="bs-btn-primary" disabled>
          Add to calendar
        </button>
        <button type="button" className="bs-btn-text" onClick={onView}>
          View booking
        </button>
      </div>
    </div>
  );
}
