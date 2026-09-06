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
    <PublicShell title={roster.title} durationMinutes={roster.durationMinutes} centered={false}>
      <div className="bs-animate-up" style={{ width: '100%', maxWidth: 760 }}>
        <h1 className="bs-h1 bs-h1-sm">Who's booked</h1>
        <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: 'var(--bs-ink-soft)' }}>
          {roster.rows.length} {roster.rows.length === 1 ? 'slot is' : 'slots are'} taken so far.
        </p>

        {roster.rows.length === 0 ? (
          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'var(--bs-ink-soft)' }}>No one yet.</p>
        ) : (
          <div style={{ marginTop: 'clamp(20px,4cqw,28px)', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {groups.map((g) => (
              <div key={g.date}>
                <div className="bs-rule">
                  <span className="bs-serif" style={{ flex: 'none', fontSize: 19 }}>
                    {wk(g.date)}, {dm(g.date)}
                  </span>
                  <span className="bs-rule-line" />
                  <span style={{ flex: 'none', fontSize: '11.5px', color: '#8b8379' }}>{g.slots.length} booked</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  {g.slots.map((s, i) => {
                    const extra = Object.entries(s.row.extraFields).filter(([, v]) => v);
                    return (
                      <div key={i} className="bs-sheet-row">
                        <span className="bs-sheet-row-time">{fmtT(s.start)}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: '14.5px', fontWeight: 500 }}>
                          {s.row.name || '—'}
                        </span>
                        {extra.map(([k, v]) => (
                          <span key={k} className="bs-tag" title={k}>
                            {v}
                          </span>
                        ))}
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
