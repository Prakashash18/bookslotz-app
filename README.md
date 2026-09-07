# BookSlot

BookSlot is for educators with one problem: a room full of students who each
need a time with you. You open an availability window, pick a slot duration,
and the app cuts it into fixed-length slots for the class to book — no
scheduling email thread. One booking per slot, real-time: a booking removes
that time for everyone else immediately.

This repo implements the design in [`design/`](./design) (a Claude Design
handoff bundle — read `design/README.md` and `design/chats/` for the full
design history) as a real app: a React + TypeScript frontend and a Supabase
Postgres backend.

## Stack

- **Frontend**: React + TypeScript + Vite, React Router. No UI framework —
  plain CSS custom properties + a handful of shared classes in `src/index.css`
  port the design's tokens (fonts, warm ochre accent, ruled-paper ground,
  step-rail/compact-header layout via CSS container queries).
- **Backend**: Supabase (Postgres). Slots are never stored — they're
  generated deterministically from `availability_windows` + `duration_minutes`
  by `generate_event_slots()` and recomputed on every read. All access goes
  through `SECURITY DEFINER` RPCs (see `supabase/migrations/`); the tables
  themselves have RLS enabled with **zero** policies, so direct REST access
  is a dead end — the only way in is through the RPCs.
- **Email**: confirmation/reschedule/cancellation emails are sent straight
  from Postgres via the `pg_net` extension calling the Resend API, with the
  API key stored in Supabase Vault (never in source or an env var).
- **Auth**: organisers have real accounts (Supabase Auth, email/password) so
  they can log in and see all their events instead of bookmarking a link.
  Bookers stay login-free — booking, rescheduling, and cancelling all still
  work purely through the private `manage_token` link emailed to them.
  Events created before accounts existed (or by an organiser who skips
  signing in) keep working through their `organiser_token` link too — both
  access paths are supported side by side.

## Project layout

```
src/
  lib/            slot-generation + formatting helpers (mirrors the SQL
                  generator so organiser-side previews match reality),
                  Supabase client + typed RPC wrappers, shared types
  components/     WizardShell (rail/compact-header/sheet), PublicShell, BareShell
  organiser/      Landing (public), AuthScreen (login/signup), the wizard
                  (what → avail → duration → slots → fields → email →
                  review), MyEvents (account dashboard), and the per-event
                  published/dashboard page
  public-site/    the public booking flow (event → day → time → details →
                  review → confirmed) and the manage/reschedule/cancel flow
supabase/
  migrations/     schema + RPCs + the pg_net/Vault email wiring
design/           the original Claude Design handoff bundle (reference only)
```

## Routes

| Route | Screen(s) |
| --- | --- |
| `/` | Public landing page |
| `/login` | Sign in / sign up |
| `/new` | Organiser wizard (requires login; draft is client-side until publish) |
| `/dashboard` | "My events" list (requires login) |
| `/e/:eventId` | Event dashboard — logged-in owner, or `?ot=<organiserToken>` link |
| `/b/:slug` | Public booking flow |
| `/b/:slug/booked/:manageToken` | Booking confirmed |
| `/b/:slug/m/:manageToken` | Manage / reschedule / cancel a booking |

## Local development

```bash
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm install
npm run dev
```

Apply `supabase/migrations/*.sql` to your Supabase project (via the
Supabase MCP tools, the Supabase CLI, or the SQL editor) before running the
app — the RPCs it calls (`create_event`, `get_public_event`, `book_slot`,
`get_booking`, `reschedule_booking`, `cancel_booking`,
`get_organiser_dashboard`) all live there.

For real email delivery, `supabase/migrations/0002_email.sql` expects a
Resend API key stored in Supabase Vault under the name `resend_api_key`:

```sql
select vault.create_secret('re_xxx', 'resend_api_key', 'Resend API key for BookSlot');
```

Sends from `bookings@coastalpatrol.app` (a domain verified in Resend), so
delivery to real bookers works — not just your own Resend account email.
If you fork this for a different domain, verify it in Resend and update
the `from` address in `send_booking_email()`.

Organiser sign-up uses Supabase's own built-in Auth email (a separate
system from the Resend wiring above) to send the "confirm your email" link
— this defaults to Supabase's shared, rate-limited sending service, fine
for low volume. For real usage, configure custom SMTP for Auth in the
Supabase dashboard (Authentication → Settings), or disable "Confirm email"
there if you'd rather skip email verification on sign-up entirely.

## Plans and the paywall

Free accounts may own `free_event_limit()` events (currently **1**). Everything
else — booking, rescheduling, cancelling, the roster, the dashboards — is
unlimited and unaffected. Events that already exist keep taking bookings
forever, whether or not the organiser is on a paid plan; the gate is on
*creating* a booking page, not on running one.

**Where it is enforced.** Inside `create_event`, in Postgres. That is the only
place that counts. The React app also asks `get_my_plan()` so it can show the
limit before someone fills in the whole wizard, but that is a courtesy — the
publishable key ships in the browser bundle, so anything the client checks can
be skipped by calling the RPC directly.

**Granting Pro.** Presence of a live row in `pro_accounts` means Pro:

```sql
-- grant, forever
insert into pro_accounts (user_id, note) values ('<auth.users.id>', 'stripe cs_...');
-- grant for a year
insert into pro_accounts (user_id, expires_at, note)
values ('<auth.users.id>', now() + interval '1 year', 'stripe cs_...');
-- revoke
delete from pro_accounts where user_id = '<auth.users.id>';
```

At this stage that is done by hand when Stripe says someone paid. A webhook
writing the same row is a drop-in replacement later — nothing else changes.

Every organiser who had created an event before migration `0008` was
grandfathered to unlimited, so the limit never retroactively broke anyone.

Set `VITE_UPGRADE_URL` to a Stripe Payment Link to give the paywall a checkout
button. Without it the paywall still enforces; it just explains and stops.

## Known gaps (carried over from the design, or deliberately deferred)

- No screen currently captures the event **location** — it's in the schema
  and shown in emails/the public page, but the wizard never asks for it
  (the design didn't have that input either; it likely belongs in the
  "Advanced settings" sheet the design's own notes call out as future work).
- "Advanced settings" (buffers, booking deadlines, allowed email domains)
  and the event detail screen (class list of who's booked) aren't built yet
  — the design explicitly flagged both as next steps.
- The organiser's rail lets you jump to any step at any time, matching the
  design; nothing blocks jumping ahead of steps you haven't filled in yet.
