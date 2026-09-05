// Slot generation & formatting helpers.
// Ported from the BookSlot design prototype's Component class (gen/groups/mins/hhmm/fmt*),
// generalised to work off arbitrary duration + availability windows.

export interface AvailabilityWindow {
  date: string; // YYYY-MM-DD
  from: string; // HH:MM
  to: string; // HH:MM
}

export interface Slot {
  key: string; // `${date}T${hhmm(start)}`
  date: string;
  start: number; // minutes from midnight
  end: number;
}

export function mins(t: string | undefined): number {
  const p = String(t || '0:0').split(':');
  return (+p[0]) * 60 + (+(p[1] || 0));
}

export function hhmm(m: number): string {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

export function fmtT(m: number): string {
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + String(mm).padStart(2, '0') + ' ' + ap;
}

export function fmtTShort(m: number): string {
  let h = Math.floor(m / 60);
  const mm = m % 60;
  h = h % 12 || 12;
  return h + ':' + String(mm).padStart(2, '0');
}

export function dObj(d: string): Date {
  return new Date(d + 'T00:00:00');
}

export function wk(d: string): string {
  return dObj(d).toLocaleDateString('en-GB', { weekday: 'long' });
}

export function dm(d: string): string {
  return dObj(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export function dmShort(d: string): string {
  return dObj(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function slotKey(date: string, start: number): string {
  return date + 'T' + hhmm(start);
}

/** Every slot the availability windows + duration produce, sorted by date/time. */
export function generateSlots(windows: AvailabilityWindow[], durationMinutes: number): Slot[] {
  const dur = Math.max(5, durationMinutes || 20);
  const ws = (windows || []).slice().sort((x, y) => (x.date < y.date ? -1 : 1));
  const out: Slot[] = [];
  ws.forEach((w) => {
    const e = mins(w.to);
    for (let st = mins(w.from); st + dur <= e; st += dur) {
      out.push({ key: slotKey(w.date, st), date: w.date, start: st, end: st + dur });
    }
  });
  return out;
}

/** Applies an optional cap on total slot count. */
export function cappedSlots(all: Slot[], maxBookings: number | null | undefined): Slot[] {
  const m = typeof maxBookings === 'number' ? maxBookings : parseInt(String(maxBookings ?? ''), 10);
  return m > 0 ? all.slice(0, m) : all;
}

/** Removes slots the organiser has manually disabled. */
export function activeSlots(capped: Slot[], disabledKeys: string[]): Slot[] {
  return capped.filter((s) => !(disabledKeys || []).includes(s.key));
}

export interface SlotDayGroup {
  date: string;
  slots: Slot[];
}

/** Groups an already-sorted slot list by date, preserving first-seen order. */
export function groupByDay(list: Slot[]): SlotDayGroup[] {
  const out: SlotDayGroup[] = [];
  const idx: Record<string, number> = {};
  list.forEach((s) => {
    if (idx[s.date] === undefined) {
      idx[s.date] = out.length;
      out.push({ date: s.date, slots: [] });
    }
    out[idx[s.date]].slots.push(s);
  });
  return out;
}

export function slugify(title: string): string {
  return (title || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
