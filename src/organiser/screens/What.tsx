import { Mark } from '../../components/WizardShell';
import { TITLE_IDEAS } from '../steps';

export function What({
  title,
  desc,
  duration,
  onTitle,
  onDesc,
  onContinue,
}: {
  title: string;
  desc: string;
  duration: number;
  onTitle: (v: string) => void;
  onDesc: (v: string) => void;
  onContinue: () => void;
}) {
  const shownTitle = title || 'Untitled event';

  return (
    <div className="bs-cols bs-animate-up">
      <div className="bs-col-main">
        <h1 className="bs-h1">What are you organising?</h1>

        <div style={{ marginTop: 'clamp(24px,4cqw,34px)' }}>
          <div className="bs-eyebrow">Title</div>
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Office Hours — Week 6"
            className="bs-serif"
            style={{
              width: '100%',
              marginTop: 10,
              padding: '0 0 12px',
              border: 0,
              borderBottom: `2px solid ${title ? 'var(--bs-accent)' : 'var(--bs-line-input)'}`,
              background: 'none',
              fontSize: 'clamp(24px,5cqw,32px)',
              lineHeight: 1.1,
              color: 'var(--bs-ink)',
              outline: 'none',
              transition: 'border-color .2s ease',
            }}
          />
        </div>

        <div style={{ marginTop: 26 }}>
          <div className="bs-eyebrow">
            Note for students{' '}
            <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none', color: '#8b8379' }}>
              — optional
            </span>
          </div>
          <input
            value={desc}
            onChange={(e) => onDesc(e.target.value)}
            placeholder="Twenty minutes each, one slot per group."
            style={{
              width: '100%',
              marginTop: 10,
              padding: '0 0 10px',
              border: 0,
              borderBottom: '1px solid var(--bs-line-soft)',
              background: 'none',
              font: 'inherit',
              fontSize: 15,
              color: 'var(--bs-ink-soft)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 22 }}>
          {TITLE_IDEAS.map((t) => (
            <button key={t} type="button" className="bs-ghost-pill" onClick={() => onTitle(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="bs-spacer" />

        <div style={{ paddingTop: 22 }}>
          <button type="button" className="bs-btn-primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>

      <div className="bs-panel">
        <div className="bs-eyebrow">Students will see</div>

        <div
          style={{
            marginTop: 16,
            border: '1px solid var(--bs-line-soft)',
            borderRadius: 14,
            background: '#fff',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(26,24,21,.04), 0 14px 30px -22px rgba(26,24,21,.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '10px 14px',
              borderBottom: '1px solid #f2ede5',
              background: 'var(--bs-well)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <Mark size={7} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--bs-label)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shownTitle}
              </span>
            </div>
            <span style={{ flex: 'none', fontSize: '9.5px', color: '#8b8379' }}>{duration} min</span>
          </div>

          <div style={{ padding: '18px 16px 20px' }}>
            <div className="bs-serif" style={{ fontSize: 24, lineHeight: 1.08 }}>
              {shownTitle}
            </div>
            {desc && (
              <div style={{ marginTop: 10, fontSize: '11.5px', lineHeight: 1.5, color: 'var(--bs-ink-soft)' }}>
                {desc}
              </div>
            )}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 26,
                    borderRadius: 6,
                    border: `1px solid ${i === 1 ? 'var(--bs-accent-border)' : 'var(--bs-line-soft)'}`,
                    background: i === 1 ? 'var(--bs-accent-wash)' : 'var(--bs-sheet)',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
                height: 30,
                background: 'var(--bs-dark)',
                borderRadius: 7,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--bs-on-dark)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Choose a time
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, lineHeight: 1.5, color: '#8b8379' }}>
          The title is what your class sees first — and what the link is named after.
        </div>
      </div>
    </div>
  );
}
