export type OrgScreen =
  | 'welcome' | 'what' | 'avail' | 'duration' | 'slots' | 'fields' | 'email' | 'review';

export const ORG_SCREENS: OrgScreen[] = ['welcome', 'what', 'avail', 'duration', 'slots', 'fields', 'email', 'review'];

export interface WizardStep {
  key: OrgScreen;
  label: string;
  screens: OrgScreen[];
}

export const STEPS: WizardStep[] = [
  { key: 'what', label: 'What it is', screens: ['what'] },
  { key: 'avail', label: 'When you’re free', screens: ['avail'] },
  { key: 'duration', label: 'How long each', screens: ['duration', 'slots'] },
  { key: 'fields', label: 'What to ask', screens: ['fields', 'email'] },
  { key: 'review', label: 'Share it', screens: ['review'] },
];

export function stepIndexForScreen(screen: OrgScreen): number {
  return STEPS.findIndex((s) => s.screens.includes(screen));
}

export function prevScreen(screen: OrgScreen): OrgScreen | null {
  const i = ORG_SCREENS.indexOf(screen);
  return i > 0 ? ORG_SCREENS[i - 1] : null;
}

export const TITLE_IDEAS = ['Office Hours — Week 6', 'Final Project Presentations', 'Parent Meetings'];
export const FIELD_CHIPS = ['Group / Team', 'Student ID', 'Notes', 'Custom field'];
export const DURATION_OPTIONS = [15, 20, 30, 45, 60];
