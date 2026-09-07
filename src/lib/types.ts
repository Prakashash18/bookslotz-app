export interface PublicSlot {
  date: string;
  start: number;
  end: number;
  taken: boolean;
}

export interface PublicEvent {
  slug: string;
  title: string;
  description: string;
  location: string;
  durationMinutes: number;
  requestedFields: string[];
  sendEmail: boolean;
  slots: PublicSlot[];
}

export interface BookingSlotInfo {
  date: string;
  start: number;
  end: number;
}

export interface BookingRecord {
  manageToken: string;
  name: string;
  email: string;
  extraFields: Record<string, string>;
  status: 'booked' | 'cancelled';
  slot: BookingSlotInfo | null;
  prevSlot: BookingSlotInfo | null;
  event: {
    title: string;
    location: string;
    durationMinutes: number;
    sendEmail: boolean;
    slug: string;
  };
}

export interface MyEventSummary {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number;
  totalSlots: number;
  bookedCount: number;
  createdAt: string;
}

export interface OrganiserBookingItem {
  id: string;
  name: string;
  email: string;
  extraFields: Record<string, string>;
  status: 'booked' | 'cancelled';
  slot: BookingSlotInfo | null;
}

export interface RosterRow {
  name: string;
  extraFields: Record<string, string>;
  slot: BookingSlotInfo;
}

export interface PublicRoster {
  title: string;
  durationMinutes: number;
  rows: RosterRow[];
}

export interface OrganiserEvent {
  id: string;
  slug: string;
  organiserToken: string;
  title: string;
  description: string;
  location: string;
  durationMinutes: number;
  maxBookings: number | null;
  requestedFields: string[];
  sendEmail: boolean;
  totalSlots: number;
  availableSlots: number;
  bookedCount: number;
  seatBooked: boolean[];
  bookings: OrganiserBookingItem[];
}

export interface MyPlan {
  isPro: boolean;
  /** Set whenever a plan row exists, live or lapsed, so the UI can say "expired on …". */
  expiresAt: string | null;
  eventCount: number;
  freeEventLimit: number;
  canCreateEvent: boolean;
}
