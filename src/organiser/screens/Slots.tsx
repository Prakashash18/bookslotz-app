import { dm, fmtT, groupByDay, wk, type Slot } from '../../lib/slots';

export function Slots({
  capped,
  off,
  available,
  duration,
  onToggle,
  onContinue,
  onAdjust,
}: {
  capped: Slot[];
  off: string[];
  available: number;
  duration: number;
  onToggle: (key: string) => void;
  onContinue: () => void;
  onAdjust: () => void;
}) {
  const groups = groupByDay(capped);
  const dayWord = groups.length === 1 ? 'day' : 'days';

  return (
    <div className="bs-cols bs-animate-up">
      <div className="bs-col-main">
        <h1 className="bs-h1 bs-h1-sm">Your schedule is ready</h1>
        <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: 'var(--bs-label)' }}>
          Tap any slot to take it off the schedule.
        </p>

        <div style={{ marginTop: 'clamp(20px,4cqw,28px)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {groups.map((g) => {
            const open = g.slots.filter((sl) => !off.includes(sl.key)).length;
            return (
              <div key={g.date}>
                <div className="bs-rule" style={{ marginBottom: 12 }}>
                  <span className="bs-eyebrow" style={{ flex: 'none' }}>
                    {wk(g.date)}, {dm(g.date)}
                  </span>
                  <span className="bs-rule-line" />
                  <span style={{ flex: 'none', fontSize: '11.5px', color: '#8b8379' }}>
                    {open} {open === 1 ? 'slot' : 'slots'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(132px,1fr))', gap: 9 }}>
                  {g.slots.map((sl) => {
                    const isOff = off.includes(sl.key);
                    return (
                      <button
                        key={sl.key}
                        type="button"
                        className={`bs-slot${isOff ? ' is-off' : ''}`}
                        onClick={() => onToggle(sl.key)}
                        title={isOff ? 'Put this slot back' : 'Take this slot off the schedule'}
                      >
                        <span className="bs-slot-time">{fmtT(sl.start)}</span>
                        <span className="bs-slot-sub">{isOff ? 'Removed' : `${duration} min`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* The capacity panel folds away on narrow viewports — this keeps the step finishable there. */}
        <div className="bs-panel-fallback" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--bs-line-soft)' }}>
          <div style={{ fontSize: '15.5px', fontWeight: 600 }}>
            {available} {available === 1 ? 'student' : 'students'} can book
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 20 }}>
            <button type="button" className="bs-btn-primary" onClick={onContinue}>
              Looks good
            </button>
            <button type="button" className="bs-btn-text" onClick={onAdjust}>
              Adjust availability
            </button>
          </div>
        </div>
      </div>

      <div className="bs-panel">
        <div className="bs-eyebrow">Capacity</div>
        <div className="bs-serif" style={{ marginTop: 12, fontSize: 46, lineHeight: 1 }}>
          {available}
        </div>
        <div style={{ marginTop: 4, fontSize: '13.5px', color: 'var(--bs-label)', lineHeight: 1.45 }}>
          {available === 1 ? 'student can book' : 'students can book'} across {groups.length} {dayWord}
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8 }}>
          {capped.slice(0, 36).map((sl) => (
            <div
              key={sl.key}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                background: off.includes(sl.key) ? 'none' : 'var(--bs-accent)',
                border: off.includes(sl.key) ? '1.5px dashed var(--bs-line-dash)' : undefined,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, fontSize: '11.5px', color: '#8b8379' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--bs-accent)' }} />
            Open
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                border: '1.5px dashed var(--bs-line-dash)',
                boxSizing: 'border-box',
              }}
            />
            Removed
          </span>
        </div>

        <div className="bs-spacer" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" className="bs-btn-primary" onClick={onContinue}>
            Looks good
          </button>
          <button type="button" className="bs-btn-text" onClick={onAdjust}>
            Adjust availability
          </button>
        </div>
      </div>
    </div>
  );
}
