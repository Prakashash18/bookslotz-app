import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BareShell, Mark } from '../components/WizardShell';
import { signOut } from '../lib/auth';
import { listMyEvents } from '../lib/supabase';
import type { MyEventSummary } from '../lib/types';

export default function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<MyEventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyEvents()
      .then((e) => !cancelled && setEvents(e))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
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
          <button type="button" className="bs-btn-primary" onClick={() => navigate('/new')}>
            New event
          </button>
        </div>
      </div>
    </BareShell>
  );
}
