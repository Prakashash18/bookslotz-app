import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BareShell } from '../components/WizardShell';
import { useSession } from '../lib/auth';
import { getEventForOrganiser, getOrganiserDashboard, organiserCancelBooking } from '../lib/supabase';
import type { OrganiserEvent } from '../lib/types';
import { dm, fmtT, wk } from '../lib/slots';

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

  return (
    <BareShell>
      <div className="bs-animate-up">
        <h1 className="bs-h1 bs-h1-sm">Your events</h1>
        <div style={{ marginTop: 'clamp(20px,4cqw,26px)', background: '#fff', border: '1px solid var(--bs-line-soft)', borderRadius: 14, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{event.title}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: 'var(--bs-label)' }}>
                {event.bookedCount} of {event.availableSlots + event.bookedCount} students booked · {event.availableSlots} slots still open
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(13px,1fr))', gap: 6 }}>
            {event.seatBooked.map((booked, i) => (
              <div key={i} className={`bs-seat${booked ? ' is-booked' : ' is-free'}`} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 20 }}>
            <button type="button" className="bs-btn-primary" style={{ padding: '13px 22px', fontSize: '14.5px' }} onClick={() => navigate(`/b/${event.slug}`)}>
              Manage
            </button>
            <button type="button" className="bs-btn-text" style={{ fontSize: 14 }} onClick={copy}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'clamp(20px,4cqw,26px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bs-label-strong)' }}>
              Who's booked
            </div>
            <button type="button" className="bs-btn-text-tight" onClick={copyRoster}>
              {copiedRoster ? 'Copied' : 'Copy link to share with class'}
            </button>
          </div>
          {event.bookings.length === 0 ? (
            <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: 'var(--bs-ink-soft)' }}>No one yet.</p>
          ) : (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {event.bookings.map((b) => {
                const cancelled = b.status === 'cancelled';
                const extra = Object.entries(b.extraFields).filter(([, v]) => v);
                const confirming = confirmCancelId === b.id;
                return (
                  <div
                    key={b.id}
                    style={{
                      padding: '14px 16px',
                      background: '#fff',
                      border: '1px solid var(--bs-line-soft)',
                      borderRadius: 12,
                      opacity: cancelled ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, textDecoration: cancelled ? 'line-through' : 'none' }}>
                        {b.name || '—'}
                      </span>
                      {cancelled && (
                        <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--bs-label)' }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 2, fontSize: '13.5px', color: 'var(--bs-label)' }}>{b.email}</div>
                    {b.slot && (
                      <div style={{ marginTop: 6, fontSize: '13.5px', color: 'var(--bs-ink-soft)' }}>
                        {wk(b.slot.date)}, {dm(b.slot.date)} · {fmtT(b.slot.start)} – {fmtT(b.slot.end)}
                      </div>
                    )}
                    {extra.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                        {extra.map(([k, v]) => (
                          <span key={k} style={{ fontSize: 13, color: 'var(--bs-ink-soft)' }}>
                            <span style={{ color: 'var(--bs-label)' }}>{k}:</span> {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {!cancelled && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--bs-line-softer)' }}>
                        {confirming ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: '#b00020' }}>
                              Cancel this booking and email {b.name || 'them'}?
                            </span>
                            <button
                              type="button"
                              className="bs-btn-text-tight"
                              style={{ color: '#b00020', fontWeight: 600 }}
                              disabled={cancelling}
                              onClick={() => confirmCancel(b.id)}
                            >
                              {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
                            </button>
                            <button
                              type="button"
                              className="bs-btn-text-tight"
                              disabled={cancelling}
                              onClick={() => setConfirmCancelId(null)}
                            >
                              Never mind
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="bs-btn-text-tight"
                            onClick={() => {
                              setCancelError(null);
                              setConfirmCancelId(b.id);
                            }}
                          >
                            Cancel booking
                          </button>
                        )}
                        {confirming && cancelError && (
                          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#b00020' }}>{cancelError}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 22 }}>
          <button
            type="button"
            className="bs-btn-text-tight"
            onClick={() => navigate(organiserToken ? '/' : '/dashboard')}
          >
            {organiserToken ? 'Start over' : 'All your events'}
          </button>
        </div>
      </div>
    </BareShell>
  );
}
