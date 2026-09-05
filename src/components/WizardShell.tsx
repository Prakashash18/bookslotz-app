import type { ReactNode } from 'react';
import { STEPS, stepIndexForScreen, type OrgScreen } from '../organiser/steps';

export function Mark({ size = 11 }: { size?: number }) {
  return <div className="bs-mark" style={{ width: size, height: size, borderRadius: size > 9 ? 2 : 2 }} />;
}

export function WizardShell({
  screen,
  onBack,
  onJump,
  eventTitle,
  railMeta,
  children,
}: {
  screen: OrgScreen;
  onBack: () => void;
  onJump: (key: OrgScreen) => void;
  eventTitle: string;
  railMeta: string;
  children: ReactNode;
}) {
  const stepIndex = stepIndexForScreen(screen);
  const inFlow = stepIndex >= 0;
  const showBack = inFlow;
  const pct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / STEPS.length) * 100) : 0;
  const stepLabel = stepIndex >= 0 ? STEPS[stepIndex].label : '';

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

          <div className="bs-rail-steps">
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

          <div className={`bs-sheet-back${inFlow ? ' bs-sheet-back--active' : ''}`}>
            {showBack && (
              <button type="button" className="bs-btn-text" onClick={onBack}>
                Back
              </button>
            )}
          </div>

          <div className="bs-sheet-body">
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
  children,
}: {
  title: string;
  durationMinutes: number;
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
          <div className="bs-sheet-body">
            <div className="bs-sheet-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bare shell for screens with no header chrome at all (dash, published, standalone booking screens). */
export function BareShell({ children }: { children: ReactNode }) {
  return (
    <div className="bs-app">
      <div className="bs-app-inner">
        <div className="bs-sheet">
          <div className="bs-sheet-body">
            <div className="bs-sheet-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
