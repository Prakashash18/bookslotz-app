import { createClient } from '@supabase/supabase-js';
import type { AvailabilityWindow } from './slots';
import type { BookingRecord, OrganiserEvent, PublicEvent } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY — copy .env.example to .env.local.');
}

export const supabase = createClient(url || '', key || '');

export class BookSlotApiError extends Error {}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new BookSlotApiError(error.message);
  if (data === null) throw new BookSlotApiError('not_found');
  return data;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  durationMinutes: number;
  maxBookings: number | null;
  requestedFields: string[];
  sendEmail: boolean;
  windows: AvailabilityWindow[];
  disabledSlots: string[];
}

export async function createEvent(input: CreateEventInput): Promise<{ id: string; slug: string; organiserToken: string }> {
  const { data, error } = await supabase.rpc('create_event', {
    p_title: input.title,
    p_description: input.description,
    p_location: input.location,
    p_duration_minutes: input.durationMinutes,
    p_max_bookings: input.maxBookings,
    p_requested_fields: input.requestedFields,
    p_send_email: input.sendEmail,
    p_windows: input.windows,
    p_disabled_slots: input.disabledSlots,
  });
  return unwrap(data, error);
}

export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  const { data, error } = await supabase.rpc('get_public_event', { p_slug: slug });
  if (error) throw new BookSlotApiError(error.message);
  return data as PublicEvent | null;
}

function siteUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export async function bookSlot(input: {
  slug: string;
  date: string;
  start: number;
  name: string;
  email: string;
  extraFields: Record<string, string>;
}): Promise<BookingRecord> {
  const { data, error } = await supabase.rpc('book_slot', {
    p_slug: input.slug,
    p_date: input.date,
    p_start_minute: input.start,
    p_name: input.name,
    p_email: input.email,
    p_extra_fields: input.extraFields,
    p_site_url: siteUrl(),
  });
  return unwrap(data, error);
}

export async function getBooking(manageToken: string): Promise<BookingRecord | null> {
  const { data, error } = await supabase.rpc('get_booking', { p_manage_token: manageToken });
  if (error) throw new BookSlotApiError(error.message);
  return data as BookingRecord | null;
}

export async function rescheduleBooking(manageToken: string, date: string, start: number): Promise<BookingRecord> {
  const { data, error } = await supabase.rpc('reschedule_booking', {
    p_manage_token: manageToken,
    p_date: date,
    p_start_minute: start,
    p_site_url: siteUrl(),
  });
  return unwrap(data, error);
}

export async function cancelBooking(manageToken: string): Promise<BookingRecord> {
  const { data, error } = await supabase.rpc('cancel_booking', { p_manage_token: manageToken, p_site_url: siteUrl() });
  return unwrap(data, error);
}

export async function getOrganiserDashboard(organiserToken: string): Promise<OrganiserEvent | null> {
  const { data, error } = await supabase.rpc('get_organiser_dashboard', { p_organiser_token: organiserToken });
  if (error) throw new BookSlotApiError(error.message);
  return data as OrganiserEvent | null;
}
