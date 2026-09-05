import { dm, fmtT, wk } from '../../lib/slots';
import type { PublicSlot } from '../../lib/types';

export function TimePicker({
  date,
  slots,
  picked,
  primaryLabel,
  showChangeDay,
  onPick,
  onPrimary,
  onChangeDay,
}: {
  date: string;
  slots: PublicSlot[];
  picked: PublicSlot | null;
  primaryLabel: string;
  showChangeDay: boolean;
  onPick: (s: PublicSlot) => void;
  onPrimary: () => void;
  onChangeDay: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1 bs-h1-pub">
        {wk(date)}, {dm(date)}
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(108px,1fr))',
          gap: 9,
          marginTop: 'clamp(24px,5cqw,32px)',
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        {slots.map((s) => {
          const isPicked = picked && picked.start === s.start;
          const cls = s.taken ? 'is-taken' : isPicked ? 'is-sel' : '';
          return (
            <button
              key={s.start}
              type="button"
              className={`bs-time${cls ? ' ' + cls : ''}`}
              disabled={s.taken}
              onClick={() => onPick(s)}
            >
              {fmtT(s.start)}
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className="bs-animate-fade" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--bs-line-soft)' }}>
          <div style={{ fontSize: 'clamp(18px,3.6cqw,22px)', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {fmtT(picked.start)} – {fmtT(picked.end)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 18 }}>
            <button type="button" className="bs-btn-primary" onClick={onPrimary}>
              {primaryLabel}
            </button>
            {showChangeDay && (
              <button type="button" className="bs-btn-text" onClick={onChangeDay}>
                Change day
              </button>
            )}
          </div>
        </div>
      ) : (
        showChangeDay && (
          <div style={{ marginTop: 24 }}>
            <button type="button" className="bs-btn-text" onClick={onChangeDay}>
              Change day
            </button>
          </div>
        )
      )}
    </div>
  );
}
