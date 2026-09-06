export function Done({
  pickedDayLong,
  pickedRange,
  location,
  sendEmail,
  bookerName,
  bookerEmail,
  extraFields,
  onManage,
}: {
  pickedDayLong: string;
  pickedRange: string;
  location: string;
  sendEmail: boolean;
  bookerName: string;
  bookerEmail: string;
  extraFields: Record<string, string>;
  onManage: () => void;
}) {
  // One extra field fits opposite the name on the stub; the rest sit under it.
  const extras = Object.entries(extraFields).filter(([, v]) => v);
  const [firstExtra, ...restExtras] = extras;

  return (
    <div className="bs-animate-up">
      <div
        className="bs-animate-pop"
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'var(--bs-accent)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 21,
          boxShadow: '0 0 0 6px oklch(0.94 0.04 75 / .55)',
        }}
      >
        ✓
      </div>
      <h1 className="bs-h1" style={{ marginTop: 20 }}>
        You're booked
      </h1>

      <div className="bs-stub" style={{ marginTop: 'clamp(20px,4cqw,26px)' }}>
        <div style={{ padding: '22px 22px 24px' }}>
          <div className="bs-eyebrow" style={{ letterSpacing: '0.11em', color: '#a39b91' }}>
            Your slot
          </div>
          <div className="bs-serif" style={{ marginTop: 12, fontSize: 'clamp(23px,4.4cqw,27px)', lineHeight: 1.08 }}>
            {pickedDayLong}
          </div>
          <div
            className="bs-nums"
            style={{
              marginTop: 10,
              fontSize: 'clamp(25px,5cqw,30px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--bs-accent-text-strong)',
            }}
          >
            {pickedRange}
          </div>
          {location && (
            <div style={{ marginTop: 14, fontSize: 14, color: 'var(--bs-label)' }}>{location}</div>
          )}
        </div>

        <div className="bs-stub-tear" />

        <div
          style={{
            padding: '18px 22px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="bs-eyebrow" style={{ letterSpacing: '0.09em', color: '#a39b91' }}>
              Booked by
            </div>
            <div style={{ marginTop: 3, fontSize: '14.5px', fontWeight: 600 }}>{bookerName || bookerEmail}</div>
            {restExtras.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--bs-label)' }}>
                {restExtras.map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </div>
            )}
          </div>
          {firstExtra && (
            <div style={{ minWidth: 0, textAlign: 'right' }}>
              <div className="bs-eyebrow" style={{ letterSpacing: '0.09em', color: '#a39b91' }}>
                {firstExtra[0]}
              </div>
              <div style={{ marginTop: 3, fontSize: '14.5px', fontWeight: 600 }}>{firstExtra[1]}</div>
            </div>
          )}
        </div>
      </div>

      {sendEmail && (
        <p style={{ margin: '20px 0 0', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--bs-label)' }}>
          A confirmation email is on its way to{' '}
          <span style={{ color: 'var(--bs-ink)', fontWeight: 600 }}>{bookerEmail}</span>, with a private link to change
          or cancel this time.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(22px,4cqw,30px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onManage}>
          Change my booking
        </button>
      </div>
    </div>
  );
}
