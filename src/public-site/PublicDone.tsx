import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BareShell, PublicShell } from '../components/WizardShell';
import { dm, fmtT, wk } from '../lib/slots';
import { getBooking } from '../lib/supabase';
import type { BookingRecord } from '../lib/types';
import { Done } from './screens/Done';

export default function PublicDone() {
  const { slug = '', manageToken = '' } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBooking(manageToken)
      .then((b) => {
        if (cancelled) return;
        if (b) setBooking(b);
        else setNotFound(true);
      })
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [manageToken]);

  if (notFound) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">We couldn't find that booking</h1>
        </div>
      </BareShell>
    );
  }

  if (!booking || !booking.slot) {
    return (
      <BareShell>
        <div className="bs-animate-up" style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>
          Loading…
        </div>
      </BareShell>
    );
  }

  return (
    <PublicShell title={booking.event.title} durationMinutes={booking.event.durationMinutes}>
      <Done
        pickedDayLong={`${wk(booking.slot.date)}, ${dm(booking.slot.date)}`}
        pickedRange={`${fmtT(booking.slot.start)} – ${fmtT(booking.slot.end)}`}
        location={booking.event.location}
        sendEmail={booking.event.sendEmail}
        bookerEmail={booking.email}
        onManage={() => navigate(`/b/${slug}/m/${manageToken}`)}
      />
    </PublicShell>
  );
}
