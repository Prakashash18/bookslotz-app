import { fmtT, mins, wk, dmShort, type AvailabilityWindow } from '../../lib/slots';

export function Availability({
  windows,
  draft,
  formOpen: formOpenProp,
  onDraftChange,
  onOpenForm,
  onRemoveWindow,
  onAddWindow,
  onContinue,
}: {
  windows: AvailabilityWindow[];
  draft: AvailabilityWindow;
  formOpen: boolean;
  onDraftChange: (patch: Partial<AvailabilityWindow>) => void;
  onOpenForm: () => void;
  onRemoveWindow: (w: AvailabilityWindow) => void;
  onAddWindow: () => void;
  onContinue: () => void;
}) {
  const hasWindows = windows.length > 0;
  const formOpen = !hasWindows || formOpenProp;
  const showAddAnother = hasWindows && !formOpenProp;
  const sorted = windows.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const canAdd = !!draft.date && mins(draft.to) > mins(draft.from);

  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">When are you available?</h1>

      {hasWindows && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'clamp(22px,5cqw,30px)' }}>
          {sorted.map((w) => (
            <div
              key={w.date}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                background: '#fff',
                border: '1px solid var(--bs-line-soft)',
                borderRadius: 13,
              }}
            >
              <div className="bs-check-badge">✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 600 }}>
                  {wk(w.date)}, {dmShort(w.date)}
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--bs-label)', marginTop: 2 }}>
                  {fmtT(mins(w.from))} – {fmtT(mins(w.to))}
                </div>
              </div>
              <button type="button" className="bs-btn-text-tight" style={{ fontSize: 13 }} onClick={() => onRemoveWindow(w)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          style={{
            marginTop: 'clamp(22px,5cqw,30px)',
            padding: 20,
            background: '#fff',
            border: '1px solid var(--bs-line-soft)',
            borderRadius: 13,
          }}
        >
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onDraftChange({ date: e.target.value })}
            className="bs-input"
            style={{ padding: '12px 14px', fontWeight: 500, fontSize: '15.5px' }}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <label style={{ flex: 1, minWidth: 0, display: 'block' }}>
              <span className="bs-field-label">From</span>
              <input
                type="time"
                value={draft.from}
                onChange={(e) => onDraftChange({ from: e.target.value })}
                className="bs-input"
                style={{ padding: '12px 14px', fontWeight: 500, fontSize: '15.5px' }}
              />
            </label>
            <label style={{ flex: 1, minWidth: 0, display: 'block' }}>
              <span className="bs-field-label">To</span>
              <input
                type="time"
                value={draft.to}
                onChange={(e) => onDraftChange({ to: e.target.value })}
                className="bs-input"
                style={{ padding: '12px 14px', fontWeight: 500, fontSize: '15.5px' }}
              />
            </label>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button
          type="button"
          className="bs-btn-primary"
          disabled={formOpen && !canAdd}
          onClick={formOpen ? onAddWindow : onContinue}
        >
          {formOpen ? 'Add availability' : 'Continue'}
        </button>
        {showAddAnother && (
          <button type="button" className="bs-btn-text" onClick={onOpenForm}>
            + Add another date
          </button>
        )}
      </div>
    </div>
  );
}
