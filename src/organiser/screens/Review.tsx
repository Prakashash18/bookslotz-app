import { dm, dmShort, slugify } from '../../lib/slots';

export function Review({
  title,
  duration,
  available,
  dates,
  fields,
  publishing,
  error,
  onPublish,
}: {
  title: string;
  duration: number;
  available: number;
  /** Distinct dates that still carry an open slot, ascending. */
  dates: string[];
  fields: string[];
  publishing: boolean;
  error: string | null;
  onPublish: () => void;
}) {
  const shownTitle = title || 'Untitled event';
  const linkPreview = `${window.location.host}/b/${slugify(title)}`;
  const span =
    dates.length === 0
      ? '—'
      : dates.length === 1
        ? dm(dates[0])
        : `${dmShort(dates[0])} – ${dm(dates[dates.length - 1])}`;

  return (
    <div className="bs-animate-up" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <h1 className="bs-h1">Ready to share</h1>
      <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: 'var(--bs-ink-soft)' }}>
        Publish it, then put the link in front of your class.
      </p>

      <div
        style={{
          marginTop: 'clamp(20px,4cqw,28px)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 26,
          alignItems: 'stretch',
          padding: 24,
          background: '#fff',
          border: '1px solid var(--bs-line-soft)',
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(26,24,21,.04), 0 18px 36px -28px rgba(26,24,21,.32)',
        }}
      >
        <div style={{ flex: 'none', width: 148 }}>
          <div
            style={{
              border: '1px solid var(--bs-line-soft)',
              borderRadius: 12,
              background: 'var(--bs-sheet)',
              padding: 14,
            }}
          >
            <div className="bs-serif" style={{ fontSize: 15, lineHeight: 1.15 }}>
              {shownTitle}
            </div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 20,
                    borderRadius: 5,
                    border: `1px solid ${i === 1 ? 'var(--bs-accent-border)' : 'var(--bs-line-soft)'}`,
                    background: i === 1 ? 'var(--bs-accent-wash-strong)' : '#fff',
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 10, height: 24, background: 'var(--bs-dark)', borderRadius: 6 }} />
          </div>
          <div
            style={{
              marginTop: 10,
              textAlign: 'center',
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#a39b91',
            }}
          >
            The student's view
          </div>
        </div>

        <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#a39b91',
            }}
          >
            Your booking link
          </div>
          <div className="bs-serif" style={{ marginTop: 10, fontSize: 30, lineHeight: 1.1 }}>
            {shownTitle}
          </div>
          <div
            style={{
              marginTop: 14,
              padding: '12px 15px',
              border: '1px solid var(--bs-line-soft)',
              borderRadius: 10,
              background: 'var(--bs-well)',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--bs-label)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {linkPreview}…
          </div>
          <div style={{ marginTop: 12, fontSize: '12.5px', color: '#8b8379', lineHeight: 1.5 }}>
            You get the real link the moment you publish. Students just tap it — no account, no app.
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 26,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 20,
          borderTop: '1px solid var(--bs-well-border)',
          paddingTop: 16,
        }}
      >
        <div>
          <div className="bs-eyebrow">Slots</div>
          <div className="bs-serif" style={{ marginTop: 7, fontSize: 26, lineHeight: 1 }}>
            {available}
          </div>
          <div style={{ marginTop: 4, fontSize: '12.5px', color: '#8b8379' }}>{duration} minutes each</div>
        </div>
        <div>
          <div className="bs-eyebrow">Across</div>
          <div className="bs-serif" style={{ marginTop: 7, fontSize: 26, lineHeight: 1 }}>
            {dates.length} {dates.length === 1 ? 'day' : 'days'}
          </div>
          <div style={{ marginTop: 4, fontSize: '12.5px', color: '#8b8379' }}>{span}</div>
        </div>
        <div>
          <div className="bs-eyebrow">Students give</div>
          <div style={{ marginTop: 9, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Name', 'Email', ...fields].map((f) => (
              <span key={f} className="bs-tag">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p style={{ margin: '18px 0 0', fontSize: '13.5px', color: '#b00020' }}>
          Couldn't publish: {error}. Please try again.
        </p>
      )}

      <div className="bs-spacer" />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, paddingTop: 22 }}>
        <button type="button" className="bs-btn-primary" onClick={onPublish} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish booking page'}
        </button>
        <span style={{ fontSize: '13.5px', color: '#8b8379' }}>You can still edit slots afterwards.</span>
      </div>
    </div>
  );
}
