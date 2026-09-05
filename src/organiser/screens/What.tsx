import { TITLE_IDEAS } from '../steps';

export function What({
  title,
  desc,
  onTitle,
  onDesc,
  onContinue,
}: {
  title: string;
  desc: string;
  onTitle: (v: string) => void;
  onDesc: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1">What are you organising?</h1>
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Office Hours — Week 6"
        style={{
          width: '100%',
          marginTop: 'clamp(24px,5cqw,34px)',
          padding: '0 0 12px',
          border: 0,
          borderBottom: '1.5px solid var(--bs-line-input)',
          background: 'none',
          font: 'inherit',
          fontSize: 'clamp(20px,4.4cqw,26px)',
          fontWeight: 500,
          color: 'var(--bs-ink)',
          outline: 'none',
        }}
      />
      <input
        value={desc}
        onChange={(e) => onDesc(e.target.value)}
        placeholder="Add a short note for your students (optional)"
        style={{
          width: '100%',
          marginTop: 20,
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 20 }}>
        {TITLE_IDEAS.map((t) => (
          <button key={t} type="button" className="bs-ghost-pill" onClick={() => onTitle(t)}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 'clamp(28px,6cqw,40px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
