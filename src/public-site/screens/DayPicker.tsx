import { dm, wk } from '../../lib/slots';
import type { PublicSlot } from '../../lib/types';
import type { SlotDayGroup } from '../../lib/slots';

export function DayPicker({
  groups,
  pickedDay,
  onPick,
}: {
  groups: SlotDayGroup<PublicSlot>[];
  pickedDay: string | null;
  onPick: (date: string) => void;
}) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1 bs-h1-pub">Which day works for you?</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'clamp(24px,5cqw,32px)' }}>
        {groups.map((g) => {
          const free = g.slots.filter((s) => !s.taken).length;
          return (
            <button key={g.date} type="button" className={`bs-day${pickedDay === g.date ? ' is-on' : ''}`} onClick={() => onPick(g.date)}>
              <span style={{ display: 'block', fontSize: 'clamp(20px,4cqw,24px)', fontWeight: 600, letterSpacing: '-0.01em' }}>{wk(g.date)}</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: '14.5px', color: 'var(--bs-label)' }}>
                {dm(g.date)} · {free} times open
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
