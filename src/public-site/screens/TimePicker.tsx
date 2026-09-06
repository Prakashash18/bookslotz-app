import { dm, fmtT, wk } from '../../lib/slots';
import type { PublicSlot } from '../../lib/types';

export function TimePicker({
  date,
  slots,
  picked,
  showChangeDay,
  onPick,
  onChangeDay,
}: {
  date: string;
  slots: PublicSlot[];
  picked: PublicSlot | null;
  showChangeDay: boolean;
  onPick: (s: PublicSlot) => void;
  onChangeDay: () => void;
}) {
  const open = slots.filter((s) => !s.taken).length;

  return (
    <div className="bs-animate-up">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="bs-h1 bs-h1-pub">
          {wk(date)}, {dm(date)}
        </h1>
        {showChangeDay && (
          <button type="button" className="bs-btn-text-tight" style={{ flex: 'none' }} onClick={onChangeDay}>
            Change day
          </button>
        )}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: '#8b8379' }}>
        {open === 0 ? 'Nothing left on this day.' : `Tap a time to hold it — ${open} open.`}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(132px,1fr))',
          gap: 10,
          marginTop: 'clamp(18px,3cqw,24px)',
        }}
      >
        {slots.map((s) => {
          const isPicked = !!picked && picked.start === s.start;
          const cls = s.taken ? 'is-taken' : isPicked ? 'is-sel' : '';
          return (
            <button
              key={s.start}
              type="button"
              className={`bs-time${cls ? ' ' + cls : ''}`}
              disabled={s.taken}
              onClick={() => onPick(s)}
            >
              <span className="bs-time-label">{fmtT(s.start)}</span>
              {s.taken && <span className="bs-time-sub">Taken</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The held slot, pinned below the scrolling list so it never leaves the screen. */
export function HeldSlotBar({
  picked,
  primaryLabel,
  onPrimary,
}: {
  picked: PublicSlot;
  primaryLabel: string;
  onPrimary: () => void;
}) {
  return (
    <div className="bs-animate-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div className="bs-eyebrow" style={{ color: 'var(--bs-label)' }}>
          Holding
        </div>
        <div className="bs-serif" style={{ marginTop: 3, fontSize: 22, lineHeight: 1.1 }}>
          {fmtT(picked.start)} – {fmtT(picked.end)}
        </div>
      </div>
      <button type="button" className="bs-btn-primary" style={{ flex: 'none' }} onClick={onPrimary}>
        {primaryLabel}
      </button>
    </div>
  );
}
