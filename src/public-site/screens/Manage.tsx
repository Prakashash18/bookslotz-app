import type { ReviewRow } from './ReviewBooking';

export function Manage({
  dayLong,
  range,
  rows,
  onReschedule,
  onCancel,
}: {
  dayLong: string;
  range: string;
  rows: ReviewRow[];
  onReschedule: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>Your booking</div>
      <h1 className="bs-h1 bs-h1-pub" style={{ marginTop: 14 }}>{dayLong}</h1>
      <div style={{ marginTop: 8, fontSize: 'clamp(17px,3.4cqw,21px)', color: 'var(--bs-ink-soft)' }}>{range}</div>
      <div
        style={{
          marginTop: 'clamp(20px,4cqw,26px)',
          padding: '18px 20px',
          border: '1px solid var(--bs-well-border)',
          borderRadius: 13,
          background: 'var(--bs-well)',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', gap: 12, fontSize: '14.5px' }}>
            <span style={{ flex: 'none', width: 104, color: 'var(--bs-label)' }}>{r.label}</span>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 500 }}>{r.value}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: '16px 0 0', fontSize: '13.5px', lineHeight: 1.55, color: 'var(--bs-label)' }}>
        This page is the private link in your confirmation email. Anyone with it can change this booking.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onReschedule}>
          Reschedule
        </button>
        <button type="button" className="bs-btn-text" onClick={onCancel}>
          Cancel booking
        </button>
      </div>
    </div>
  );
}
