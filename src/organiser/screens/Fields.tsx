import { FIELD_CHIPS } from '../steps';

export function Fields({
  fields,
  onRemove,
  onAdd,
  onContinue,
}: {
  fields: string[];
  onRemove: (f: string) => void;
  onAdd: (f: string) => void;
  onContinue: () => void;
}) {
  const asked = [{ label: 'Name', removable: false }, { label: 'Email', removable: false }, ...fields.map((f) => ({ label: f, removable: true }))];

  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">What should students tell you?</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 'clamp(22px,5cqw,30px)' }}>
        {asked.map((f) => (
          <div
            key={f.label}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', border: '1px solid var(--bs-line-soft)', borderRadius: 11 }}
          >
            <div className="bs-check-badge" style={{ width: 18, height: 18, fontSize: 10 }}>
              ✓
            </div>
            <span style={{ flex: 1, fontSize: '14.5px', fontWeight: 500 }}>{f.label}</span>
            {f.removable && (
              <button
                type="button"
                onClick={() => onRemove(f.label)}
                style={{ border: 0, background: 'none', font: 'inherit', fontSize: 17, lineHeight: 1, color: 'var(--bs-label)', cursor: 'pointer', padding: '2px 5px' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: '14.5px', color: 'var(--bs-ink-soft)', marginBottom: 11 }}>Need anything else?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FIELD_CHIPS.map((c) => {
            const on = fields.includes(c);
            return (
              <button key={c} type="button" className={`bs-chip${on ? ' is-on' : ''}`} onClick={() => onAdd(c)}>
                {on ? c : `+ ${c}`}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'clamp(28px,5cqw,38px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
