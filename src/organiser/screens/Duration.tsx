import { DURATION_OPTIONS } from '../steps';

export function Duration({
  duration,
  customDur,
  maxBookings,
  possible,
  windowCount,
  onPick,
  onCustom,
  onMax,
  onContinue,
}: {
  duration: number;
  customDur: string;
  maxBookings: string;
  possible: number;
  windowCount: number;
  onPick: (m: number) => void;
  onCustom: (v: string) => void;
  onMax: (v: string) => void;
  onContinue: () => void;
}) {
  const dayWord = windowCount === 1 ? 'day' : 'days';

  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">How much time does each student need?</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))', gap: 10, marginTop: 'clamp(24px,5cqw,32px)' }}>
        {DURATION_OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            className={`bs-tile${duration === m ? ' is-on' : ''}`}
            onClick={() => onPick(m)}
          >
            {m} min
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13.5px', color: 'var(--bs-label)' }}>Custom</span>
        <input
          value={customDur}
          onChange={(e) => onCustom(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="min"
          style={{
            width: 74,
            padding: '8px 10px',
            border: '1px solid var(--bs-line-input)',
            borderRadius: 8,
            background: '#fff',
            font: 'inherit',
            fontSize: 14,
            textAlign: 'center',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginTop: 'clamp(24px,5cqw,32px)', padding: 20, border: '1px solid var(--bs-well-border)', borderRadius: 14, background: 'var(--bs-well)' }}>
        <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 'clamp(24px,5cqw,32px)', lineHeight: 1.1 }}>
          {possible} possible slots
        </div>
        <div style={{ marginTop: 5, fontSize: '13.5px', color: 'var(--bs-label)' }}>
          Enough for {possible} students across {windowCount} {dayWord}.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--bs-well-border)',
          }}
        >
          <span style={{ fontSize: '14.5px', color: 'var(--bs-ink-soft)' }}>Class smaller than that?</span>
          <input
            value={maxBookings}
            onChange={(e) => onMax(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="All"
            className="bs-input"
            style={{
              width: 78,
              padding: '9px 12px',
              borderRadius: 9,
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onContinue}>
          Generate slots
        </button>
        <button type="button" className="bs-btn-text" style={{ fontSize: 14 }} disabled>
          Advanced settings
        </button>
      </div>
    </div>
  );
}
