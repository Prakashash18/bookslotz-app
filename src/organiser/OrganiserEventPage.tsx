import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BareShell, Mark } from '../components/WizardShell';
import { useSession } from '../lib/auth';
import { getEventForOrganiser, getOrganiserDashboard, organiserCancelBooking } from '../lib/supabase';
import type { OrganiserBookingItem, OrganiserEvent } from '../lib/types';
import { dm, fmtT, groupByDay, wk } from '../lib/slots';

type ViewScreen = 'published' | 'dash';

export default function OrganiserEventPage() {
  const { eventId = '' } = useParams();
  const [search] = useSearchParams();
  const organiserToken = search.get('ot');
  const location = useLocation() as { state?: { justPublished?: boolean } };
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();

  const [screen, setScreen] = useState<ViewScreen>(location.state?.justPublished ? 'published' : 'dash');
  const [event, setEvent] = useState<OrganiserEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedRoster, setCopiedRoster] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelledEffect = false;

    // A ?ot= link keeps working with no login required (legacy / shareable path).
    if (organiserToken) {
      getOrganiserDashboard(organiserToken)
        .then((e) => {
          if (!cancelledEffect) {
            if (e) setEvent(e);
            else setError('not_found');
          }
        })
        .catch((e) => !cancelledEffect && setError(e instanceof Error ? e.message : String(e)));
      return () => {
        cancelledEffect = true;
      };
    }

    // No token: this is the account-based path — require login, then check ownership.
    if (sessionLoading) return;
    if (!session) {
      navigate('/login', { state: { next: `/e/${eventId}` }, replace: true });
      return;
    }

    getEventForOrganiser(eventId)
      .then((e) => {
        if (!cancelledEffect) {
          if (e) setEvent(e);
          else setError('not_found');
        }
      })
      .catch((e) => !cancelledEffect && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelledEffect = true;
    };
  }, [organiserToken, eventId, session, sessionLoading, navigate]);

  async function refetch() {
    const e = organiserToken ? await getOrganiserDashboard(organiserToken) : await getEventForOrganiser(eventId);
    if (e) setEvent(e);
  }

  async function confirmCancel(bookingId: string) {
    setCancelling(true);
    setCancelError(null);
    try {
      await organiserCancelBooking(bookingId, organiserToken);
      await refetch();
      setConfirmCancelId(null);
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : String(e));
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <h1 className="bs-h1 bs-h1-sm">This dashboard link isn't valid</h1>
          <p style={{ margin: '16px 0 0', fontSize: '15px', color: 'var(--bs-ink-soft)' }}>
            Double check the link from your publish confirmation, or start a new booking page.
          </p>
          <div style={{ marginTop: 24 }}>
            <button type="button" className="bs-btn-primary" onClick={() => navigate('/')}>
              Start over
            </button>
          </div>
        </div>
      </BareShell>
    );
  }

  if (!event) {
    return <BareShell>
      <div className="bs-animate-up" style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>Loading…</div>
    </BareShell>;
  }

  const url = `${window.location.origin}/b/${event.slug}`;
  const rosterUrl = `${url}/roster`;

  const copy = () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoster = () => {
    navigator.clipboard?.writeText(rosterUrl).catch(() => {});
    setCopiedRoster(true);
    setTimeout(() => setCopiedRoster(false), 2000);
  };

  if (screen === 'published') {
    return (
      <BareShell>
        <div className="bs-animate-up">
          <div className="bs-animate-pop" style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bs-accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
            ✓
          </div>
          <h1 className="bs-h1" style={{ marginTop: 20 }}>Your booking page is live</h1>
          <p style={{ margin: '14px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)', lineHeight: 1.55 }}>
            Send this to your class. {event.availableSlots} slots are open.
          </p>
          <div
            style={{
              marginTop: 'clamp(20px,4cqw,26px)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '15px 18px',
              background: '#fff',
              border: '1px solid var(--bs-line-soft)',
              borderRadius: 12,
            }}
          >
            <span style={{ flex: 1, minWidth: 0, fontSize: '14.5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url}
            </span>
            <span style={{ flex: 'none', fontSize: '12.5px', color: 'var(--bs-accent-text-strong)', fontWeight: 600, opacity: copied ? 1 : 0, transition: 'opacity .3s' }}>
              Copied
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
            <button type="button" className="bs-btn-primary" onClick={copy}>
              Copy link
            </button>
            <button type="button" className="bs-btn-text" onClick={() => navigate(`/b/${event.slug}`)}>
              View booking page
            </button>
          </div>
          <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--bs-line-soft)' }}>
            <button type="button" className="bs-btn-text-tight" onClick={() => setScreen('dash')}>
              ••• More
            </button>
          </div>
        </div>
      </BareShell>
    );
  }

  const totalSlots = event.availableSlots + event.bookedCount;
  // Bookings arrive newest last; the call sheet reads by day, then by time of day.
  const byDay = groupByDay(
    event.bookings
      .filter((b) => b.slot)
      .slice()
      .sort((a, b) =>
        a.slot!.date === b.slot!.date ? a.slot!.start - b.slot!.start : a.slot!.date < b.slot!.date ? -1 : 1,
      )
      .map((b) => ({ ...b, date: b.slot!.date })),
  );
  const undated = event.bookings.filter((b) => !b.slot);

  return (
    <BareShell
      centered={false}
      header={
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <Mark size={10} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {event.title}
            </span>
            <span className="bs-state-chip is-live">Live</span>
          </div>
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              className="bs-btn-text-tight"
              onClick={() => navigate(organiserToken ? '/' : '/dashboard')}
            >
              {organiserToken ? 'Start over' : 'All your events'}
            </button>
            <button type="button" className="bs-ghost-pill" style={{ fontWeight: 600 }} onClick={copy}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </>
      }
    >
      <div className="bs-cols bs-cols--stack bs-animate-up">
        <div className="bs-side">
          <div className="bs-eyebrow">Booked</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="bs-serif bs-nums" style={{ fontSize: 58, lineHeight: 1 }}>
              {event.bookedCount}
            </span>
            <span className="bs-serif bs-nums" style={{ fontSize: 26, lineHeight: 1, color: '#a39b91' }}>
              / {totalSlots}
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: '13.5px', color: 'var(--bs-label)' }}>
            {event.availableSlots} {event.availableSlots === 1 ? 'slot' : 'slots'} still open
          </div>

          <div style={{ marginTop: 20, maxWidth: 288, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8 }}>
            {event.seatBooked.map((booked, i) => (
              <div key={i} className={`bs-seat${booked ? ' is-booked' : ' is-free'}`} />
            ))}
          </div>

          <div
            style={{
              marginTop: 26,
              padding: '16px 18px',
              border: '1px solid var(--bs-well-border)',
              borderRadius: 13,
              background: 'var(--bs-well)',
            }}
          >
            <div className="bs-eyebrow">Class roster</div>
            <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.5, color: 'var(--bs-ink-soft)' }}>
              A read-only page your class can check — names and times only.
            </div>
            <button
              type="button"
              onClick={copyRoster}
              style={{
                marginTop: 12,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                border: '1px solid var(--bs-line-input)',
                borderRadius: 9,
                background: '#fff',
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  color: 'var(--bs-label)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                …/{event.slug}/roster
              </span>
              <span style={{ flex: 'none', fontSize: '11.5px', fontWeight: 600, color: 'var(--bs-accent-text-strong)' }}>
                {copiedRoster ? 'Copied' : 'Copy'}
              </span>
            </button>
          </div>

          <div className="bs-spacer" />
          <button
            type="button"
            className="bs-btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => navigate(`/b/${event.slug}`)}
          >
            View booking page
          </button>
        </div>

        <div className="bs-col-list">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span className="bs-eyebrow">Who's booked</span>
            <span style={{ fontSize: '12.5px', color: '#8b8379' }}>By time</span>
          </div>

          {event.bookings.length === 0 ? (
            <p style={{ margin: '14px 0 0', fontSize: '14.5px', color: 'var(--bs-ink-soft)' }}>
              No one yet. Share the link and they'll show up here.
            </p>
          ) : (
            <>
              {byDay.map((g) => {
                const live = g.slots.filter((b) => b.status !== 'cancelled').length;
                return (
                  <div key={g.date} style={{ marginTop: 18 }}>
                    <div className="bs-rule">
                      <span className="bs-serif" style={{ flex: 'none', fontSize: 19 }}>
                        {wk(g.date)}, {dm(g.date)}
                      </span>
                      <span className="bs-rule-line" />
                      <span style={{ flex: 'none', fontSize: '11.5px', color: '#8b8379' }}>{live} booked</span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {g.slots.map((b) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          confirming={confirmCancelId === b.id}
                          cancelling={cancelling}
                          cancelError={cancelError}
                          onAskCancel={() => {
                            setCancelError(null);
                            setConfirmCancelId(b.id);
                          }}
                          onConfirm={() => confirmCancel(b.id)}
                          onDismiss={() => setConfirmCancelId(null)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {undated.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div className="bs-rule">
                    <span className="bs-serif" style={{ flex: 'none', fontSize: 19 }}>
                      No time set
                    </span>
                    <span className="bs-rule-line" />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {undated.map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        confirming={confirmCancelId === b.id}
                        cancelling={cancelling}
                        cancelError={cancelError}
                        onAskCancel={() => {
                          setCancelError(null);
                          setConfirmCancelId(b.id);
                        }}
                        onConfirm={() => confirmCancel(b.id)}
                        onDismiss={() => setConfirmCancelId(null)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BareShell>
  );
}

/** One line of the call sheet: time, who, what they told you, and the cancel affordance. */
function BookingRow({
  booking: b,
  confirming,
  cancelling,
  cancelError,
  onAskCancel,
  onConfirm,
  onDismiss,
}: {
  booking: OrganiserBookingItem;
  confirming: boolean;
  cancelling: boolean;
  cancelError: string | null;
  onAskCancel: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const cancelled = b.status === 'cancelled';
  const extra = Object.entries(b.extraFields).filter(([, v]) => v);

  return (
    <div>
      <div className={`bs-sheet-row${cancelled ? ' is-cancelled' : ''}`}>
        <span className="bs-sheet-row-time">{b.slot ? fmtT(b.slot.start) : '—'}</span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '14.5px',
            fontWeight: 500,
            textDecoration: cancelled ? 'line-through' : 'none',
          }}
          title={b.email}
        >
          {b.name || '—'}
        </span>
        {extra.map(([k, v]) => (
          <span key={k} className="bs-tag" title={k}>
            {v}
          </span>
        ))}
        {cancelled ? (
          <span
            style={{
              flex: 'none',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#8b8379',
            }}
          >
            Cancelled
          </span>
        ) : (
          <button
            type="button"
            className="bs-btn-text-tight"
            style={{ flex: 'none', fontSize: '12.5px' }}
            onClick={onAskCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {confirming && !cancelled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            padding: '10px 4px 12px',
            borderBottom: '1px solid var(--bs-line-softer)',
          }}
        >
          <span style={{ fontSize: 13, color: '#b00020' }}>Cancel this booking and email {b.name || 'them'}?</span>
          <button
            type="button"
            className="bs-btn-text-tight"
            style={{ color: '#b00020', fontWeight: 600 }}
            disabled={cancelling}
            onClick={onConfirm}
          >
            {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
          </button>
          <button type="button" className="bs-btn-text-tight" disabled={cancelling} onClick={onDismiss}>
            Never mind
          </button>
          {cancelError && <p style={{ margin: 0, fontSize: 13, color: '#b00020' }}>{cancelError}</p>}
        </div>
      )}
    </div>
  );
}
