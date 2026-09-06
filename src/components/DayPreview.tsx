import { fmtT, wk } from '../lib/slots';

const HOUR_PX = 30;
const MIN_HOURS = 6;

/** The hour range the timeline draws: the window plus an hour of breathing room each side. */
function timelineRange(from: number, to: number): { startH: number; endH: number } {
  let startH = Math.max(0, Math.floor(from / 60) - 1);
  let endH = Math.min(24, Math.ceil(to / 60) + 1);
  while (endH - startH < MIN_HOURS && endH < 24) endH += 1;
  while (endH - startH < MIN_HOURS && startH > 0) startH -= 1;
  return { startH, endH };
}

function hourLabel(h: number): string {
  const hour = h % 24;
  if (hour === 0) return '12 am';
  if (hour === 12) return '12 pm';
  return hour > 12 ? String(hour - 12) : String(hour);
}

/**
 * The right-hand panel on the availability step: the day being carved into slots,
 * drawn to scale, so the organiser sees the shape of what they are creating.
 */
export function DayPreview({
  date,
  from,
  to,
  duration,
}: {
  date: string;
  from: number;
  to: number;
  duration: number;
}) {
  const { startH, endH } = timelineRange(from, to);
  const hours: number[] = [];
  for (let h = startH; h < endH; h++) hours.push(h);
  const height = hours.length * HOUR_PX;
  const bandTop = (from / 60 - startH) * HOUR_PX;
  const bandHeight = Math.max(6, ((to - from) / 60) * HOUR_PX);
  const count = Math.max(0, Math.floor((to - from) / Math.max(5, duration)));
  const seats = Array.from({ length: Math.min(count, 24) });

  return (
    <>
      <div className="bs-eyebrow">Preview · {wk(date)}</div>

      <div style={{ position: 'relative', height, marginTop: 16 }}>
        <div style={{ position: 'absolute', left: 0, top: -6, width: 44 }}>
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_PX, fontSize: '10.5px', color: '#8b8379' }}>
              {hourLabel(h)}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 46,
            right: 0,
            top: 0,
            height,
            borderLeft: '1px solid var(--bs-line-input)',
            backgroundImage: `repeating-linear-gradient(180deg, rgba(26,24,21,0.07) 0 1px, rgba(0,0,0,0) 1px ${HOUR_PX}px)`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 46,
            right: 0,
            top: bandTop,
            height: bandHeight,
            background: 'var(--bs-accent-wash)',
            borderLeft: '3px solid var(--bs-accent)',
            borderTop: '1px solid var(--bs-accent-border)',
            borderBottom: '1px solid var(--bs-accent-border)',
            backgroundImage:
              'repeating-linear-gradient(180deg, var(--bs-accent-border) 0 1px, rgba(0,0,0,0) 1px 10px)',
            transition: 'top .25s ease, height .25s ease',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 58,
            top: bandTop + 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--bs-accent-text-strong)',
          }}
        >
          {count} × {duration} min
        </div>
      </div>

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--bs-well-border)' }}>
        <div className="bs-serif" style={{ fontSize: 40, lineHeight: 1 }}>
          {count} {count === 1 ? 'slot' : 'slots'}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--bs-label)', lineHeight: 1.45 }}>
          {fmtT(from)} – {fmtT(to)}, {duration} minutes apiece.
        </div>
      </div>

      {seats.length > 0 && (
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 7 }}>
          {seats.map((_, i) => (
            <div key={i} className="bs-seat is-free" />
          ))}
        </div>
      )}
    </>
  );
}
