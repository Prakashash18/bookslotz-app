import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BareShell, PublicShell } from '../components/WizardShell';
import { dm, fmtT, groupByDay, wk } from '../lib/slots';
import { bookSlot, getPublicEvent } from '../lib/supabase';
import type { PublicEvent, PublicSlot } from '../lib/types';
import { EventIntro } from './screens/EventIntro';
import { DayPicker } from './screens/DayPicker';
import { TimePicker } from './screens/TimePicker';
import { Details } from './screens/Details';
import { ReviewBooking } from './screens/ReviewBooking';

type Screen = 'pEvent' | 'pDay' | 'pTime' | 'pDetails' | 'pReview';

export default function PublicBookingFlow() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [screen, setScreen] = useState<Screen>('pEvent');
  const [pDay, setPDay] = useState<string | null>(null);
  const [pSlot, setPSlot] = useState<PublicSlot | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicEvent(slug)
      .then((e) => {
        if (cancelled) return;
        if (e) setEvent(e);
        else setNotFound(true);
      })
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">This booking page isn't available</h1>
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>
            Double-check the link the organiser sent you.
          </p>
        </div>
      </BareShell>
    );
  }

  if (!event) {
    return (
      <BareShell>
        <div className="bs-animate-up" style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>
          Loading…
        </div>
      </BareShell>
    );
  }

  const groups = groupByDay(event.slots);
  const freeTotal = event.slots.filter((s) => !s.taken).length;
  const curDate = pDay ?? groups[0]?.date ?? '';
  const daySlots = groups.find((g) => g.date === curDate)?.slots ?? [];
  const picked = pSlot && pSlot.date === curDate ? pSlot : null;

  async function confirm() {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      const extra: Record<string, string> = {};
      event!.requestedFields.forEach((f) => {
        extra[f] = details[f] || '';
      });
      const booking = await bookSlot({
        slug,
        date: picked.date,
        start: picked.start,
        name: details.name || '',
        email: details.email || '',
        extraFields: extra,
      });
      navigate(`/b/${slug}/booked/${booking.manageToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell title={event.title} durationMinutes={event.durationMinutes}>
      {screen === 'pEvent' && (
        <EventIntro
          event={event}
          freeTotal={freeTotal}
          onStart={() => {
            if (groups.length > 1) setScreen('pDay');
            else {
              setPDay(groups[0]?.date ?? null);
              setScreen('pTime');
            }
          }}
        />
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
          primaryLabel="Continue"
          showChangeDay={true}
          onPick={(s) => setPSlot(s)}
          onPrimary={() => setScreen('pDetails')}
          onChangeDay={() => setScreen('pDay')}
        />
      )}

      {screen === 'pDetails' && (
        <Details
          fields={[
            { key: 'name', label: 'Name', value: details.name || '', placeholder: 'Your full name' },
            { key: 'email', label: 'Email', value: details.email || '', placeholder: 'you@student.edu' },
            ...event.requestedFields.map((f) => ({ key: f, label: f, value: details[f] || '', placeholder: '' })),
          ]}
          onChange={(key, value) => setDetails((d) => ({ ...d, [key]: value }))}
          onContinue={() => setScreen('pReview')}
          canContinue={!!details.name && !!details.email}
        />
      )}

      {screen === 'pReview' && picked && (
        <ReviewBooking
          title={event.title}
          pickedDayLong={`${wk(picked.date)}, ${dm(picked.date)}`}
          pickedRange={`${fmtT(picked.start)} – ${fmtT(picked.end)}`}
          location={event.location}
          rows={[
            { label: 'Name', value: details.name || '—' },
            { label: 'Email', value: details.email || '—' },
            ...event.requestedFields.map((f) => ({ label: f, value: details[f] || '—' })),
          ]}
          submitting={submitting}
          error={error}
          onConfirm={confirm}
          onChange={() => setScreen('pTime')}
        />
      )}
    </PublicShell>
  );
}
