import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardShell } from '../components/WizardShell';
import { activeSlots, cappedSlots, generateSlots, type AvailabilityWindow } from '../lib/slots';
import { createEvent } from '../lib/supabase';
import { prevScreen, type OrgScreen } from './steps';
import { What } from './screens/What';
import { Availability } from './screens/Availability';
import { Duration } from './screens/Duration';
import { Slots } from './screens/Slots';
import { Fields } from './screens/Fields';
import { EmailStep } from './screens/EmailStep';
import { Review } from './screens/Review';

export interface WizardState {
  screen: OrgScreen;
  title: string;
  desc: string;
  location: string;
  windows: AvailabilityWindow[];
  draft: AvailabilityWindow;
  formOpen: boolean;
  duration: number;
  customDur: string;
  maxBookings: string;
  off: string[];
  fields: string[];
  sendEmail: boolean;
  organiserEmail: string;
}

function nextDay(date: string): string {
  if (!date) return '';
  return new Date(new Date(date + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10);
}

const INITIAL: WizardState = {
  screen: 'what',
  title: '',
  desc: '',
  location: '',
  windows: [],
  draft: { date: '', from: '09:00', to: '17:00' },
  formOpen: false,
  duration: 20,
  customDur: '',
  maxBookings: '',
  off: [],
  fields: [],
  sendEmail: true,
  organiserEmail: '',
};

export default function OrganiserWizard() {
  const [s, setS] = useState<WizardState>(INITIAL);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const navigate = useNavigate();

  const set = (patch: Partial<WizardState> | ((st: WizardState) => Partial<WizardState>)) =>
    setS((st) => ({ ...st, ...(typeof patch === 'function' ? patch(st) : patch) }));

  const go = (screen: OrgScreen) => set({ screen });
  const back = () => {
    const p = prevScreen(s.screen);
    if (p === 'welcome' || !p) navigate('/');
    else go(p);
  };

  const all = generateSlots(s.windows, s.duration);
  const capped = cappedSlots(all, s.maxBookings ? parseInt(s.maxBookings, 10) : null);
  const active = activeSlots(capped, s.off);
  const railMeta = active.length ? `${active.length} slots · ${s.duration} min each` : `${s.duration} min each`;
  const activeDates = Array.from(new Set(active.map((sl) => sl.date))).sort();
  // Steps that carry a live preview or a long list get the top-anchored, two-column sheet.
  const wide = s.screen === 'what' || s.screen === 'avail' || s.screen === 'slots' || s.screen === 'review';

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const created = await createEvent({
        title: s.title,
        description: s.desc,
        location: s.location,
        durationMinutes: s.duration,
        maxBookings: s.maxBookings ? parseInt(s.maxBookings, 10) : null,
        requestedFields: s.fields,
        sendEmail: s.sendEmail,
        windows: s.windows,
        disabledSlots: s.off,
        organiserEmail: s.organiserEmail,
      });
      navigate(`/e/${created.id}?ot=${created.organiserToken}`, { state: { justPublished: true } });
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <WizardShell
      screen={s.screen}
      onBack={back}
      onJump={go}
      eventTitle={s.title || 'Untitled event'}
      railMeta={railMeta}
      centered={!wide}
    >
      {s.screen === 'what' && (
        <What
          title={s.title}
          desc={s.desc}
          duration={s.duration}
          onTitle={(v) => set({ title: v })}
          onDesc={(v) => set({ desc: v })}
          onContinue={() => go('avail')}
        />
      )}

      {s.screen === 'avail' && (
        <Availability
          windows={s.windows}
          draft={s.draft}
          duration={s.duration}
          formOpen={s.formOpen}
          onDraftChange={(patch) => set({ draft: { ...s.draft, ...patch } })}
          onOpenForm={() => set({ formOpen: true })}
          onRemoveWindow={(w) => set({ windows: s.windows.filter((x) => x !== w) })}
          onAddWindow={() => {
            const d = s.draft;
            if (!d.date) return;
            set((st) => ({
              windows: st.windows.concat([{ date: d.date, from: d.from, to: d.to }]),
              formOpen: false,
              draft: { date: nextDay(d.date), from: d.from, to: d.to },
            }));
          }}
          onContinue={() => go('duration')}
        />
      )}

      {s.screen === 'duration' && (
        <Duration
          duration={s.duration}
          customDur={s.customDur}
          maxBookings={s.maxBookings}
          possible={all.length}
          windowCount={s.windows.length}
          onPick={(m) => set({ duration: m, customDur: '' })}
          onCustom={(v) => set({ customDur: v, duration: v ? +v : s.duration })}
          onMax={(v) => set({ maxBookings: v })}
          onContinue={() => go('slots')}
        />
      )}

      {s.screen === 'slots' && (
        <Slots
          capped={capped}
          off={s.off}
          available={active.length}
          duration={s.duration}
          onToggle={(key) =>
            set((st) => ({ off: st.off.includes(key) ? st.off.filter((k) => k !== key) : st.off.concat([key]) }))
          }
          onContinue={() => go('fields')}
          onAdjust={() => go('avail')}
        />
      )}

      {s.screen === 'fields' && (
        <Fields
          fields={s.fields}
          onRemove={(f) => set({ fields: s.fields.filter((x) => x !== f) })}
          onAdd={(f) => set((st) => ({ fields: st.fields.includes(f) ? st.fields : st.fields.concat([f]) }))}
          onContinue={() => go('email')}
        />
      )}

      {s.screen === 'email' && (
        <EmailStep
          title={s.title}
          location={s.location}
          sendEmail={s.sendEmail}
          sampleSlot={active[0] ?? null}
          organiserEmail={s.organiserEmail}
          onYes={() => set({ sendEmail: true })}
          onNo={() => set({ sendEmail: false })}
          onOrganiserEmail={(v) => set({ organiserEmail: v })}
          onContinue={() => go('review')}
        />
      )}

      {s.screen === 'review' && (
        <Review
          title={s.title}
          duration={s.duration}
          available={active.length}
          dates={activeDates}
          fields={s.fields}
          publishing={publishing}
          error={publishError}
          onPublish={publish}
        />
      )}
    </WizardShell>
  );
}
