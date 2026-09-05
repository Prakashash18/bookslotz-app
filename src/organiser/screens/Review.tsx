export function Review({
  title,
  duration,
  available,
  fields,
  publishing,
  error,
  onPublish,
}: {
  title: string;
  duration: number;
  available: number;
  fields: string[];
  publishing: boolean;
  error: string | null;
  onPublish: () => void;
}) {
  const fieldSummary = ['Name', 'Email', ...fields].join(' + ');

  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">Ready to share</h1>
      <div style={{ marginTop: 'clamp(22px,5cqw,30px)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div
          style={{
            flex: '1 1 190px',
            minWidth: 0,
            background: '#fff',
            border: '1px solid var(--bs-line-soft)',
            borderRadius: 13,
            padding: 16,
            boxShadow: '0 1px 2px rgba(26,24,21,.04)',
          }}
        >
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bs-label-strong)' }}>bookslot.app</div>
          <div style={{ marginTop: 9, fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 17, lineHeight: 1.15 }}>{title}</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            <div style={{ height: 22, border: '1px solid var(--bs-line-soft)', borderRadius: 5, background: 'var(--bs-sheet)' }} />
            <div style={{ height: 22, border: '1px solid var(--bs-accent-border)', borderRadius: 5, background: 'var(--bs-accent-wash-strong)' }} />
            <div style={{ height: 22, border: '1px solid var(--bs-line-soft)', borderRadius: 5, background: 'var(--bs-sheet)' }} />
            <div style={{ height: 22, border: '1px solid var(--bs-line-soft)', borderRadius: 5, background: 'var(--bs-sheet)' }} />
          </div>
          <div style={{ marginTop: 12, height: 26, background: 'var(--bs-dark)', borderRadius: 6 }} />
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--bs-label-strong)' }}>Event</div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, marginTop: 3 }}>{title}</div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--bs-label-strong)' }}>Slots</div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, marginTop: 3 }}>
              {available} slots · {duration} minutes each
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--bs-label-strong)' }}>Students give</div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, marginTop: 3 }}>{fieldSummary}</div>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ margin: '18px 0 0', fontSize: '13.5px', color: '#b00020' }}>
          Couldn't publish: {error}. Please try again.
        </p>
      )}

      <div style={{ marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onPublish} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish booking page'}
        </button>
      </div>
    </div>
  );
}
