export interface ReviewRow {
  label: string;
  value: string;
}

export function ReviewBooking({
  title,
  pickedDayLong,
  pickedRange,
  location,
  rows,
  submitting,
  error,
  onConfirm,
  onChange,
}: {
  title: string;
  pickedDayLong: string;
  pickedRange: string;
  location: string;
  rows: ReviewRow[];
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onChange: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1 bs-h1-sm">{title}</h1>
      <div
        style={{
          marginTop: 'clamp(22px,5cqw,28px)',
          padding: 22,
          background: '#fff',
          border: '1px solid var(--bs-line-soft)',
          borderRadius: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 'clamp(19px,3.8cqw,23px)', fontWeight: 600, letterSpacing: '-0.01em' }}>{pickedDayLong}</div>
          <div style={{ marginTop: 4, fontSize: 16, color: 'var(--bs-ink-soft)' }}>{pickedRange}</div>
          <div style={{ marginTop: 4, fontSize: 14, color: 'var(--bs-label)' }}>{location}</div>
        </div>
        <div style={{ height: 1, background: 'var(--bs-line-softer)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', gap: 12, fontSize: '14.5px' }}>
              <span style={{ flex: 'none', width: 104, color: 'var(--bs-label)' }}>{r.label}</span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p style={{ margin: '14px 0 0', fontSize: '13.5px', color: '#b00020' }}>Couldn't book that slot: {error}.</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
        <button type="button" className="bs-btn-text" onClick={onChange}>
          Change
        </button>
      </div>
    </div>
  );
}
