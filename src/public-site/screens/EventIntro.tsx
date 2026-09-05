import type { PublicEvent } from '../../lib/types';

export function EventIntro({ event, freeTotal, onStart }: { event: PublicEvent; freeTotal: number; onStart: () => void }) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1 bs-h1-lg bs-h1-wrap">{event.title}</h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 26px',
          marginTop: 20,
          padding: '16px 0',
          borderTop: '1px solid var(--bs-well-border)',
          borderBottom: '1px solid var(--bs-well-border)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>Where</div>
          <div style={{ marginTop: 3, fontSize: '14.5px', fontWeight: 500 }}>{event.location || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>Length</div>
          <div style={{ marginTop: 3, fontSize: '14.5px', fontWeight: 500 }}>{event.durationMinutes} minutes</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>Open</div>
          <div style={{ marginTop: 3, fontSize: '14.5px', fontWeight: 500 }}>{freeTotal} slots left</div>
        </div>
      </div>
      {event.description && (
        <p style={{ margin: '20px 0 0', fontSize: 'clamp(15px,2.6cqw,17px)', lineHeight: 1.6, color: 'var(--bs-ink-soft)', maxWidth: '42ch' }}>
          {event.description}
        </p>
      )}
      <div style={{ marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button type="button" className="bs-btn-primary bs-lift" onClick={onStart} disabled={freeTotal === 0}>
          {freeTotal === 0 ? 'Fully booked' : 'Choose a time'}
        </button>
      </div>
    </div>
  );
}
