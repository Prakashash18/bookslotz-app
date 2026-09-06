import type { CSSProperties, ReactNode } from 'react';
import { STEPS, stepIndexForScreen, type OrgScreen } from '../organiser/steps';

export function Mark({ size = 11 }: { size?: number }) {
  return <div className="bs-mark" style={{ width: size, height: size, borderRadius: size > 9 ? 2 : 2 }} />;
}

/** Row pitch of the step rail: 23px dot + 2×7px padding + 2px gap. */
const RAIL_ROW_PITCH = 39;
/** Distance from the spine's top edge down to the first dot's centre. */
const RAIL_SPINE_OFFSET = 4.5;

export function WizardShell({
  screen,
  onBack,
  onJump,
  eventTitle,
  railMeta,
  centered = true,
  children,
}: {
  screen: OrgScreen;
  onBack: () => void;
  onJump: (key: OrgScreen) => void;
  eventTitle: string;
  railMeta: string;
  /** Centre the content in a 600px column (short screens); false anchors it to the top edge. */
  centered?: boolean;
  children: ReactNode;
}) {
  const stepIndex = stepIndexForScreen(screen);
  const inFlow = stepIndex >= 0;
  const showBack = inFlow;
  const pct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / STEPS.length) * 100) : 0;
  const stepLabel = stepIndex >= 0 ? STEPS[stepIndex].label : '';
  const railProgress = stepIndex > 0 ? stepIndex * RAIL_ROW_PITCH + RAIL_SPINE_OFFSET : 0;

  return (
    <div className="bs-app">
      <div className="bs-app-inner">
        <div className={`bs-rail${inFlow ? ' bs-rail--active' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Mark size={11} />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>BookSlot</span>
          </div>
          <div
            style={{
              marginTop: 11,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--bs-label-strong)',
            }}
          >
            For educators
          </div>

          <div className="bs-rail-steps" style={{ '--bs-rail-progress': `${railProgress}px` } as CSSProperties}>
            {STEPS.map((s, i) => {
              const state = i === stepIndex ? 'now' : i < stepIndex ? 'done' : 'todo';
              return (
                <button key={s.key} type="button" className="bs-rail-row" onClick={() => onJump(s.key)}>
                  <span className={`bs-rail-dot is-${state}`}>{state === 'done' ? '✓' : i + 1}</span>
                  <span className={`bs-rail-label is-${state}`}>{s.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ paddingTop: 18, borderTop: '1px solid var(--bs-line-dash)' }}>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--bs-label-strong)',
              }}
            >
              This event
            </div>
            <div style={{ marginTop: 7, fontSize: '13.5px', fontWeight: 600, lineHeight: 1.3 }}>{eventTitle}</div>
            <div style={{ marginTop: 4, fontSize: '12.5px', color: 'var(--bs-label)', lineHeight: 1.4 }}>{railMeta}</div>
          </div>
        </div>

        <div className="bs-sheet">
          <div className={`bs-compact-header${inFlow ? ' bs-compact-header--active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <Mark size={9} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--bs-label)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Step {stepIndex + 1} of {STEPS.length} · {stepLabel}
                </span>
              </div>
              {showBack && (
                <button type="button" className="bs-btn-text-tight" onClick={onBack}>
                  Back
                </button>
              )}
            </div>
            <div className="bs-progress-track">
              <div className="bs-progress-fill" style={{ width: pct + '%' }} />
            </div>
          </div>

          <div className={`bs-sheet-header${inFlow ? ' bs-sheet-header--active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {eventTitle}
              </span>
              <span className="bs-state-chip">Draft</span>
            </div>
            {showBack && (
              <button type="button" className="bs-btn-text-tight" onClick={onBack}>
                Back
              </button>
            )}
          </div>

          <div className={`bs-sheet-body${centered ? ' is-centered' : ''}`}>
            <div className="bs-sheet-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicShell({
  title,
  durationMinutes,
  centered = true,
  footer,
  children,
}: {
  title: string;
  durationMinutes: number;
  /** Centre the content in a 600px column; false anchors it to the top edge. */
  centered?: boolean;
  /** Pinned bar below the scrolling body — the held slot, on the time picker. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bs-app">
      <div className="bs-app-inner">
        <div className="bs-sheet">
          <div className="bs-pub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <Mark size={9} />
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--bs-ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
            </div>
            <span style={{ flex: 'none', fontSize: 12, color: 'var(--bs-label)', whiteSpace: 'nowrap' }}>
              {durationMinutes} min each
            </span>
          </div>
          <div className={`bs-sheet-body${centered ? ' is-centered' : ''}`}>
            <div className="bs-sheet-content">{children}</div>
          </div>
          {footer && <div className="bs-sheet-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** Bare shell for screens with little or no header chrome (dash, published, standalone booking screens). */
export function BareShell({
  centered = true,
  header,
  children,
}: {
  centered?: boolean;
  /** Optional header band — shown at every width, unlike the wizard's. */
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bs-app">
      <div className="bs-app-inner">
        <div className="bs-sheet">
          {header && <div className="bs-sheet-header bs-sheet-header--always">{header}</div>}
          <div className={`bs-sheet-body${centered ? ' is-centered' : ''}`}>
            <div className="bs-sheet-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
