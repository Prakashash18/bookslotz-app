import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BareShell, PublicShell } from '../components/WizardShell';
import { dm, fmtT, groupByDay, wk } from '../lib/slots';
import { cancelBooking, getBooking, getPublicEvent, rescheduleBooking } from '../lib/supabase';
import type { BookingRecord, PublicEvent, PublicSlot } from '../lib/types';
import { DayPicker } from './screens/DayPicker';
import { TimePicker } from './screens/TimePicker';
import { Manage } from './screens/Manage';
import { Moved } from './screens/Moved';
import { Cancelled } from './screens/Cancelled';

type Screen = 'pManage' | 'pDay' | 'pTime' | 'pMoved' | 'pCancelled';

export default function PublicManageFlow() {
  const { slug = '', manageToken = '' } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [screen, setScreen] = useState<Screen>('pManage');
  const [pDay, setPDay] = useState<string | null>(null);
  const [pSlot, setPSlot] = useState<PublicSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPublicEvent(slug), getBooking(manageToken)])
      .then(([e, b]) => {
        if (cancelled) return;
        if (e && b) {
          setEvent(e);
          setBooking(b);
          setScreen(b.status === 'cancelled' ? 'pCancelled' : 'pManage');
        } else setNotFound(true);
      })
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [slug, manageToken]);

  if (notFound) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">We couldn't find that booking</h1>
        </div>
      </BareShell>
    );
  }

  if (!event || !booking) {
    return (
      <BareShell>
        <div className="bs-animate-up" style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>
          Loading…
        </div>
      </BareShell>
    );
  }

  const groups = groupByDay(event.slots);
  const curDate = pDay ?? groups[0]?.date ?? '';
  const daySlots = groups.find((g) => g.date === curDate)?.slots ?? [];
  const picked = pSlot && pSlot.date === curDate ? pSlot : null;

  const reviewRows = [
    { label: 'Name', value: booking.name || '—' },
    { label: 'Email', value: booking.email || '—' },
    ...event.requestedFields.map((f) => ({ label: f, value: booking.extraFields[f] || '—' })),
  ];

  async function doReschedule() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await rescheduleBooking(manageToken, picked.date, picked.start);
      setBooking(updated);
      const refreshed = await getPublicEvent(slug);
      if (refreshed) setEvent(refreshed);
      setScreen('pMoved');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    setBusy(true);
    setError(null);
    try {
      const updated = await cancelBooking(manageToken);
      setBooking(updated);
      const refreshed = await getPublicEvent(slug);
      if (refreshed) setEvent(refreshed);
      setScreen('pCancelled');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell title={event.title} durationMinutes={event.durationMinutes}>
      {screen === 'pManage' && booking.slot && (
        <>
          <Manage
            dayLong={`${wk(booking.slot.date)}, ${dm(booking.slot.date)}`}
            range={`${fmtT(booking.slot.start)} – ${fmtT(booking.slot.end)}`}
            rows={reviewRows}
            onReschedule={() => {
              setPSlot(null);
              setPDay(null);
              setScreen(groups.length > 1 ? 'pDay' : 'pTime');
            }}
            onCancel={doCancel}
          />
          {busy && <p style={{ fontSize: 13, color: 'var(--bs-label)' }}>Working…</p>}
          {error && <p style={{ fontSize: 13, color: '#b00020' }}>{error}</p>}
        </>
      )}

      {screen === 'pDay' && (
        <DayPicker
          groups={groups}
          pickedDay={pDay}
          onPick={(date) => {
            setPDay(date);
            setPSlot(null);
            setScreen('pTime');
          }}
        />
      )}

      {screen === 'pTime' && (
        <TimePicker
          date={curDate}
          slots={daySlots}
          picked={picked}
          primaryLabel={busy ? 'Moving…' : 'Move to this time'}
          showChangeDay={groups.length > 1}
          onPick={(s) => setPSlot(s)}
          onPrimary={doReschedule}
          onChangeDay={() => setScreen('pDay')}
        />
      )}

      {screen === 'pMoved' && booking.slot && booking.prevSlot && (
        <Moved
          prevDayLong={`${wk(booking.prevSlot.date)}, ${dm(booking.prevSlot.date)}`}
          prevRange={`${fmtT(booking.prevSlot.start)} – ${fmtT(booking.prevSlot.end)}`}
          nowDayLong={`${wk(booking.slot.date)}, ${dm(booking.slot.date)}`}
          nowRange={`${fmtT(booking.slot.start)} – ${fmtT(booking.slot.end)}`}
          bookerEmail={booking.email}
          onView={() => setScreen('pManage')}
        />
      )}

      {screen === 'pCancelled' && booking.prevSlot && (
        <Cancelled
          prevDayLong={`${wk(booking.prevSlot.date)}, ${dm(booking.prevSlot.date)}`}
          prevRange={`${fmtT(booking.prevSlot.start)} – ${fmtT(booking.prevSlot.end)}`}
          onChooseAnother={() => navigate(`/b/${slug}`)}
        />
      )}
    </PublicShell>
  );
}
