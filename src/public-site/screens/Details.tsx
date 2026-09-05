export interface DetailField {
  key: string;
  label: string;
  value: string;
  placeholder: string;
}

export function Details({
  fields,
  onChange,
  onContinue,
  canContinue,
}: {
  fields: DetailField[];
  onChange: (key: string, value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="bs-animate-up">
      <h1 className="bs-h1 bs-h1-pub">Your details</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 'clamp(24px,5cqw,32px)' }}>
        {fields.map((f) => (
          <label key={f.key} style={{ display: 'block' }}>
            <span className="bs-field-label">{f.label}</span>
            <input
              value={f.value}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="bs-input"
              style={{ fontSize: 16 }}
            />
          </label>
        ))}
      </div>
      <div style={{ marginTop: 'clamp(26px,5cqw,36px)' }}>
        <button type="button" className="bs-btn-primary" onClick={onContinue} disabled={!canContinue}>
          Review booking
        </button>
      </div>
    </div>
  );
}
