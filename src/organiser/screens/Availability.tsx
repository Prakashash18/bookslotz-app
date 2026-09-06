import { DayPreview } from '../../components/DayPreview';
import { fmtT, mins, wk, dmShort, type AvailabilityWindow } from '../../lib/slots';

/** The mini day-scale each window row is drawn against: 7 am to 9 pm. */
const SCALE_FROM = 7 * 60;
const SCALE_TO = 21 * 60;

function pct(m: number): number {
  return Math.min(100, Math.max(0, ((m - SCALE_FROM) / (SCALE_TO - SCALE_FROM)) * 100));
}

export function Availability({
  windows,
  draft,
  duration,
  formOpen: formOpenProp,
  onDraftChange,
  onOpenForm,
  onRemoveWindow,
  onAddWindow,
  onContinue,
}: {
  windows: AvailabilityWindow[];
  draft: AvailabilityWindow;
  duration: number;
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

  // The panel previews whatever is being worked on: the draft when the form is open
  // and usable, otherwise the last day that was added.
  const previewWindow = formOpen && canAdd ? draft : sorted[sorted.length - 1];

  return (
    <div className="bs-cols bs-animate-up">
      <div className="bs-col-main">
        <h1 className="bs-h1">When are you available?</h1>
        <p style={{ margin: '12px 0 0', fontSize: '14.5px', lineHeight: 1.5, color: 'var(--bs-ink-soft)', maxWidth: '42ch' }}>
          Add one window per day. Each becomes a run of bookable slots.
        </p>

        {hasWindows && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'clamp(20px,4cqw,26px)' }}>
            {sorted.map((w) => {
              const from = mins(w.from);
              const to = mins(w.to);
              const count = Math.max(0, Math.floor((to - from) / Math.max(5, duration)));
              return (
                <div
                  key={w.date}
                  style={{
                    padding: '14px 16px',
                    background: '#fff',
                    border: '1px solid var(--bs-line-soft)',
                    borderRadius: 13,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="bs-check-badge">✓</div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600 }}>
                        {wk(w.date)}, {dmShort(w.date)}
                      </span>
                      <span style={{ fontSize: '13.5px', color: 'var(--bs-label)' }}>
                        {fmtT(from)} – {fmtT(to)}
                      </span>
                    </div>
                    <span
                      style={{
                        flex: 'none',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: 'var(--bs-accent-text-strong)',
                      }}
                    >
                      {count} {count === 1 ? 'slot' : 'slots'}
                    </span>
                    <button
                      type="button"
                      className="bs-btn-text-tight"
                      style={{ fontSize: 13 }}
                      onClick={() => onRemoveWindow(w)}
                    >
                      Remove
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 11,
                      position: 'relative',
                      height: 8,
                      borderRadius: 4,
                      background: '#f2ede5',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${pct(from)}%`,
                        width: `${Math.max(1, pct(to) - pct(from))}%`,
                        background: 'var(--bs-accent)',
                        backgroundImage:
                          'repeating-linear-gradient(90deg, rgba(255,255,255,0.55) 0 1px, rgba(255,255,255,0) 1px 10px)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10.5px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#8b8379',
                    }}
                  >
                    <span>7 am</span>
                    <span>9 pm</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {formOpen && (
          <div
            style={{
              marginTop: 'clamp(16px,3cqw,20px)',
              padding: 18,
              background: '#fff',
              border: '1px solid var(--bs-line-soft)',
              borderRadius: 13,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <label style={{ flex: '1.3 1 150px', minWidth: 0, display: 'block' }}>
              <span className="bs-field-label">Date</span>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => onDraftChange({ date: e.target.value })}
                className="bs-input"
                style={{ padding: '11px 13px', fontWeight: 600, fontSize: 15 }}
              />
            </label>
            <label style={{ flex: '1 1 110px', minWidth: 0, display: 'block' }}>
              <span className="bs-field-label">From</span>
              <input
                type="time"
                value={draft.from}
                onChange={(e) => onDraftChange({ from: e.target.value })}
                className="bs-input"
                style={{ padding: '11px 13px', fontWeight: 600, fontSize: 15 }}
              />
            </label>
            <label style={{ flex: '1 1 110px', minWidth: 0, display: 'block' }}>
              <span className="bs-field-label">To</span>
              <input
                type="time"
                value={draft.to}
                onChange={(e) => onDraftChange({ to: e.target.value })}
                className="bs-input"
                style={{ padding: '11px 13px', fontWeight: 600, fontSize: 15 }}
              />
            </label>
          </div>
        )}

        <div className="bs-spacer" />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, paddingTop: 22 }}>
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
          {formOpen && hasWindows && (
            <button type="button" className="bs-btn-text" onClick={onContinue}>
              Continue with {windows.length} {windows.length === 1 ? 'day' : 'days'}
            </button>
          )}
        </div>
      </div>

      {previewWindow && (
        <div className="bs-panel">
          <DayPreview
            date={previewWindow.date}
            from={mins(previewWindow.from)}
            to={mins(previewWindow.to)}
            duration={duration}
          />
        </div>
      )}
    </div>
  );
}
