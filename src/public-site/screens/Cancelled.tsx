export function Cancelled({
  prevDayLong,
  prevRange,
  onChooseAnother,
}: {
  prevDayLong: string;
  prevRange: string;
  onChooseAnother: () => void;
}) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1 bs-h1-pub">Your booking is cancelled</h1>
      <p style={{ margin: '16px 0 0', fontSize: '15.5px', lineHeight: 1.6, color: 'var(--bs-ink-soft)', maxWidth: '42ch' }}>
        {prevDayLong}, {prevRange} is open again. You can still take another time while slots last.
      </p>
      <div style={{ marginTop: 'clamp(24px,5cqw,34px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onChooseAnother}>
          Choose another time
        </button>
      </div>
    </div>
  );
}
