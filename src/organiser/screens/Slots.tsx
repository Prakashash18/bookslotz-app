import { dm, fmtT, fmtTShort, groupByDay, wk, type Slot } from '../../lib/slots';

export function Slots({
  capped,
  off,
  available,
  onToggle,
  onContinue,
  onAdjust,
}: {
  capped: Slot[];
  off: string[];
  available: number;
  onToggle: (key: string) => void;
  onContinue: () => void;
  onAdjust: () => void;
}) {
  const groups = groupByDay(capped);

  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">Your schedule is ready</h1>
      <p style={{ margin: '12px 0 0', fontSize: '14.5px', color: 'var(--bs-label)' }}>Tap any slot to take it off the schedule.</p>

      <div style={{ marginTop: 'clamp(22px,5cqw,30px)', display: 'flex', flexDirection: 'column', gap: 24, maxHeight: 300, overflow: 'auto' }}>
        {groups.map((g) => (
          <div key={g.date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ flex: 'none', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bs-label-strong)' }}>
                {wk(g.date)}, {dm(g.date)}
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--bs-well-border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(128px,1fr))', gap: 8 }}>
              {g.slots.map((sl) => {
                const isOff = off.includes(sl.key);
                return (
                  <button key={sl.key} type="button" className={`bs-slot${isOff ? ' is-off' : ''}`} onClick={() => onToggle(sl.key)}>
                    {fmtTShort(sl.start)} – {fmtT(sl.end)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--bs-line-soft)', fontSize: '15.5px', fontWeight: 600 }}>
        {available} students can book
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onContinue}>
          Looks good
        </button>
        <button type="button" className="bs-btn-text" onClick={onAdjust}>
          Adjust availability
        </button>
      </div>
    </div>
  );
}
