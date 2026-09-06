import { dmShort, wk, type SlotDayGroup } from '../../lib/slots';
import type { PublicEvent, PublicSlot } from '../../lib/types';

export function EventIntro({
  event,
  groups,
  freeTotal,
  onStart,
  onRoster,
}: {
  event: PublicEvent;
  groups: SlotDayGroup<PublicSlot>[];
  freeTotal: number;
  onStart: () => void;
  onRoster: () => void;
}) {
  const total = event.slots.length;

  return (
    <div className="bs-cols bs-animate-up">
      <div className="bs-col-main">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            color: 'var(--bs-accent-text-strong)',
          }}
        >
          Pick your time
        </div>
        <h1 className="bs-h1 bs-h1-lg bs-h1-wrap" style={{ marginTop: 14 }}>
          {event.title}
        </h1>

        {event.description && (
          <p
            style={{
              margin: '20px 0 0',
              fontSize: 'clamp(15px,2.6cqw,16px)',
              lineHeight: 1.6,
              color: 'var(--bs-ink-soft)',
              maxWidth: '44ch',
            }}
          >
            {event.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px 26px',
            marginTop: 30,
            padding: '18px 0',
            borderTop: '1px solid var(--bs-well-border)',
            borderBottom: '1px solid var(--bs-well-border)',
          }}
        >
          <div style={{ minWidth: 110 }}>
            <div className="bs-eyebrow" style={{ color: '#8b8379' }}>
              Where
            </div>
            <div style={{ marginTop: 5, fontSize: 15, fontWeight: 600 }}>{event.location || '—'}</div>
          </div>
          <div style={{ minWidth: 110 }}>
            <div className="bs-eyebrow" style={{ color: '#8b8379' }}>
              Length
            </div>
            <div style={{ marginTop: 5, fontSize: 15, fontWeight: 600 }}>{event.durationMinutes} minutes</div>
          </div>
          <div style={{ minWidth: 110 }}>
            <div className="bs-eyebrow" style={{ color: '#8b8379' }}>
              Open
            </div>
            <div style={{ marginTop: 5, fontSize: 15, fontWeight: 600, color: 'var(--bs-accent-text-strong)' }}>
              {freeTotal} of {total} left
            </div>
          </div>
        </div>

        <div className="bs-spacer" />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 22, paddingTop: 24 }}>
          <button type="button" className="bs-btn-primary bs-lift" onClick={onStart} disabled={freeTotal === 0}>
            {freeTotal === 0 ? 'Fully booked' : 'Choose a time'}
          </button>
          <button type="button" className="bs-btn-text" onClick={onRoster}>
            See who's booked
          </button>
        </div>
      </div>

      <div
        className="bs-panel"
        style={{
          width: 320,
          border: '1px solid var(--bs-line-soft)',
          borderRadius: 16,
          background: '#fff',
          padding: 22,
          boxShadow: '0 1px 2px rgba(26,24,21,.04), 0 18px 36px -30px rgba(26,24,21,.3)',
        }}
      >
        <div className="bs-eyebrow">What's left</div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 22, overflow: 'auto' }}>
          {groups.map((g) => {
            const open = g.slots.filter((s) => !s.taken).length;
            return (
              <div key={g.date}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span className="bs-serif" style={{ fontSize: 20 }}>
                    {wk(g.date)}, {dmShort(g.date)}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#8b8379' }}>{open} open</span>
                </div>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
                  {g.slots.map((s) => (
                    <div
                      key={s.start}
                      style={{
                        height: 30,
                        borderRadius: 7,
                        border: s.taken ? '1px dashed #e8e3db' : '1px solid #e8e3db',
                        background: s.taken ? 'transparent' : 'var(--bs-sheet)',
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid #f2ede5',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: '11.5px',
            color: '#8b8379',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 16, height: 12, borderRadius: 4, border: '1px solid #e8e3db', background: 'var(--bs-sheet)' }} />
            Open
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 16, height: 12, borderRadius: 4, border: '1px dashed #e8e3db' }} />
            Taken
          </span>
        </div>

        <div className="bs-spacer" />
        <div style={{ marginTop: 18, fontSize: '12.5px', lineHeight: 1.55, color: '#8b8379' }}>
          One booking per slot — once it's taken it disappears for everyone.
        </div>
      </div>
    </div>
  );
}
