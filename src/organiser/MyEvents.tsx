import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BareShell, Mark } from '../components/WizardShell';
import { UpgradeCard } from '../components/UpgradeCard';
import { signOut } from '../lib/auth';
import { getMyPlan, listMyEvents } from '../lib/supabase';
import type { MyEventSummary, MyPlan } from '../lib/types';

export default function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<MyEventSummary[] | null>(null);
  const [plan, setPlan] = useState<MyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyEvents()
      .then((e) => !cancelled && setEvents(e))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    // The limit is shown here, before anyone fills in the wizard — but it is
    // create_event that actually enforces it.
    getMyPlan()
      .then((p) => !cancelled && setPlan(p))
      .catch(() => {
        /* plan is decoration; a failure here must not block the list */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <BareShell
      centered={false}
      header={
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Mark size={10} />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>BookSlot</span>
          </div>
          <button type="button" className="bs-btn-text-tight" onClick={handleSignOut}>
            Sign out
          </button>
        </>
      }
    >
      <div className="bs-animate-up">
        <h1 className="bs-h1 bs-h1-sm">Your events</h1>

        {error && <p style={{ margin: '16px 0 0', fontSize: '13.5px', color: '#b00020' }}>{error}</p>}

        {!events && !error && (
          <p style={{ margin: '20px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>Loading…</p>
        )}

        {events && events.length === 0 && (
          <p style={{ margin: '20px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>
            No events yet — create your first booking page.
          </p>
        )}

        {events && events.length > 0 && (
          <div style={{ marginTop: 'clamp(20px,4cqw,26px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => navigate(`/e/${e.id}`)}
                style={{
                  textAlign: 'left',
                  border: '1px solid var(--bs-line-soft)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  background: '#fff',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div className="bs-serif" style={{ flex: 1, minWidth: 0, fontSize: 22, lineHeight: 1.1 }}>
                    {e.title}
                  </div>
                  <div className="bs-nums" style={{ flex: 'none', fontSize: '13.5px', fontWeight: 600, color: 'var(--bs-accent-text-strong)' }}>
                    {e.bookedCount}/{e.totalSlots}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 6,
                    borderRadius: 3,
                    background: '#f2ede5',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${e.totalSlots > 0 ? Math.round((e.bookedCount / e.totalSlots) * 100) : 0}%`,
                      background: 'var(--bs-accent)',
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: '13.5px', color: 'var(--bs-label)' }}>
                  {e.totalSlots - e.bookedCount} still open · {e.durationMinutes} min each
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          {plan && !plan.canCreateEvent ? (
            <UpgradeCard eventCount={plan.eventCount} freeEventLimit={plan.freeEventLimit} compact />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
              <button type="button" className="bs-btn-primary" onClick={() => navigate('/new')}>
                New event
              </button>
              {plan && !plan.isPro && (
                <span style={{ fontSize: '13.5px', color: '#8b8379' }}>
                  Free plan · {plan.eventCount} of {plan.freeEventLimit} booking{' '}
                  {plan.freeEventLimit === 1 ? 'page' : 'pages'} used
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </BareShell>
  );
}
