/**
 * Shown wherever the free-tier limit is reached. The database is what actually
 * refuses the action (create_event raises event_limit_reached); this card only
 * explains it and points at the checkout link.
 */
const UPGRADE_URL = import.meta.env.VITE_UPGRADE_URL as string | undefined;

export function UpgradeCard({
  eventCount,
  freeEventLimit,
  compact = false,
}: {
  eventCount: number;
  freeEventLimit: number;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        padding: compact ? '18px 20px' : 24,
        background: '#fff',
        border: '1px solid var(--bs-accent-border)',
        borderRadius: 16,
        boxShadow: '0 1px 2px rgba(26,24,21,.04), 0 18px 36px -30px rgba(26,24,21,.3)',
      }}
    >
      <div className="bs-eyebrow" style={{ color: 'var(--bs-accent-text-strong)' }}>
        Free plan · {eventCount} of {freeEventLimit} used
      </div>

      <div className="bs-serif" style={{ marginTop: 10, fontSize: compact ? 24 : 30, lineHeight: 1.1 }}>
        You've used your free booking page
      </div>

      <p style={{ margin: '10px 0 0', fontSize: '14.5px', lineHeight: 1.55, color: 'var(--bs-ink-soft)', maxWidth: '46ch' }}>
        Your existing {eventCount === 1 ? 'page keeps' : 'pages keep'} running and taking bookings — nothing you've
        already shared with students will break. Upgrade to publish more.
      </p>

      <ul
        style={{
          margin: '16px 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 14,
          color: 'var(--bs-ink)',
        }}
      >
        {['Unlimited booking pages', 'No BookSlot branding on your public page', 'Priority on new features'].map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="bs-check-badge" style={{ flex: 'none' }}>
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 20 }}>
        {UPGRADE_URL ? (
          <a
            className="bs-btn-primary"
            href={UPGRADE_URL}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Upgrade
          </a>
        ) : (
          <span style={{ fontSize: '13.5px', color: 'var(--bs-label)' }}>
            Upgrades aren't switched on yet — set <code>VITE_UPGRADE_URL</code> to your checkout link.
          </span>
        )}
        <span style={{ fontSize: '13.5px', color: '#8b8379' }}>Cancel any time.</span>
      </div>
    </div>
  );
}
