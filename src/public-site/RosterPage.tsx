import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BareShell, PublicShell } from '../components/WizardShell';
import { dm, fmtT, groupByDay, wk } from '../lib/slots';
import { getPublicRoster } from '../lib/supabase';
import type { PublicRoster } from '../lib/types';

export default function RosterPage() {
  const { slug = '' } = useParams();
  const [roster, setRoster] = useState<PublicRoster | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicRoster(slug)
      .then((r) => {
        if (cancelled) return;
        if (r) setRoster(r);
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
          <h1 className="bs-h1 bs-h1-sm">This roster isn't available</h1>
        </div>
      </BareShell>
    );
  }

  if (!roster) {
    return (
      <BareShell>
        <div className="bs-animate-up" style={{ fontSize: 15, color: 'var(--bs-ink-soft)' }}>
          Loading…
        </div>
      </BareShell>
    );
  }

  const groups = groupByDay(roster.rows.map((r) => ({ ...r.slot, row: r })));

  return (
    <PublicShell title={roster.title} durationMinutes={roster.durationMinutes}>
      <div className="bs-animate-up">
        <h1 className="bs-h1 bs-h1-sm">Who's booked</h1>
        {roster.rows.length === 0 ? (
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>No one yet.</p>
        ) : (
          <div style={{ marginTop: 'clamp(22px,5cqw,30px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {groups.map((g) => (
              <div key={g.date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span
                    style={{
                      flex: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--bs-label-strong)',
                    }}
                  >
                    {wk(g.date)}, {dm(g.date)}
                  </span>
                  <span style={{ flex: 1, height: 1, background: 'var(--bs-well-border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.slots.map((s, i) => {
                    const extra = Object.entries(s.row.extraFields).filter(([, v]) => v);
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 14,
                          padding: '12px 16px',
                          background: '#fff',
                          border: '1px solid var(--bs-line-soft)',
                          borderRadius: 11,
                        }}
                      >
                        <span style={{ flex: 'none', width: 92, fontSize: '13.5px', fontWeight: 600, color: 'var(--bs-ink)' }}>
                          {fmtT(s.start)}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: '14.5px', fontWeight: 500 }}>{s.row.name || '—'}</span>
                        {extra.length > 0 && (
                          <span style={{ flex: 'none', fontSize: 13, color: 'var(--bs-label)' }}>
                            {extra.map(([, v]) => v).join(', ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
