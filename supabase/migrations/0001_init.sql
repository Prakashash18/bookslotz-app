-- BookSlot core schema + RPCs.
-- Model: an organiser opens availability windows + a slot duration; slots are
-- generated deterministically from those (never stored per-slot). Bookings
-- claim one generated slot each, guarded by a partial unique index so two
-- concurrent bookers can never win the same slot. No login for either side:
-- the organiser gets a private `organiser_token` link, bookers get a private
-- `manage_token` link (both opaque uuids, unguessable, not exposed to anyone
-- else). All access goes through SECURITY DEFINER RPCs — the tables
-- themselves have RLS enabled with zero policies, so direct REST access is a
-- dead end and PII (emails, tokens) can't leak through PostgREST's default
-- table endpoints.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  organiser_token uuid not null default gen_random_uuid() unique,
  title text not null,
  description text not null default '',
  location text not null default '',
  duration_minutes int not null check (duration_minutes >= 1),
  max_bookings int check (max_bookings is null or max_bookings > 0),
  requested_fields text[] not null default '{}',
  send_email boolean not null default true,
  disabled_slots text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  date date not null,
  start_minute int not null check (start_minute >= 0 and start_minute < 1440),
  end_minute int not null check (end_minute > start_minute and end_minute <= 1440)
);
create index availability_windows_event_id_idx on public.availability_windows(event_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  slot_date date,
  slot_start_minute int,
  slot_end_minute int,
  name text not null,
  email text not null,
  extra_fields jsonb not null default '{}',
  manage_token uuid not null default gen_random_uuid() unique,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  rescheduled_from_date date,
  rescheduled_from_start_minute int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_slot_present_when_booked check (
    (status = 'booked' and slot_date is not null and slot_start_minute is not null and slot_end_minute is not null)
    or (status = 'cancelled')
  )
);
create index bookings_event_id_idx on public.bookings(event_id);
-- Prevents two concurrent bookers from ever winning the same slot.
create unique index bookings_unique_active_slot
  on public.bookings(event_id, slot_date, slot_start_minute)
  where status = 'booked';

alter table public.events enable row level security;
alter table public.availability_windows enable row level security;
alter table public.bookings enable row level security;
-- No policies are defined: RLS with zero policies denies all direct access
-- (select/insert/update/delete) via the REST API for every role. The only
-- way in is through the SECURITY DEFINER functions below.

revoke all on public.events, public.availability_windows, public.bookings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Slot generation (internal helper, not exposed directly)
-- ---------------------------------------------------------------------------

create or replace function public.generate_event_slots(p_event_id uuid)
returns table(slot_date date, start_minute int, end_minute int)
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select duration_minutes, max_bookings, disabled_slots
    from public.events where id = p_event_id
  ),
  raw as (
    select w.date as slot_date, gs.start_minute, gs.start_minute + ev.duration_minutes as end_minute
    from public.availability_windows w
    cross join ev
    cross join lateral generate_series(w.start_minute, w.end_minute - ev.duration_minutes, ev.duration_minutes) as gs(start_minute)
    where w.event_id = p_event_id
  ),
  ordered as (
    select raw.*, row_number() over (order by slot_date, start_minute) as rn
    from raw
  )
  select ordered.slot_date, ordered.start_minute, ordered.end_minute
  from ordered, ev
  where (ev.max_bookings is null or ordered.rn <= ev.max_bookings)
    and not (ordered.slot_date::text || ':' || ordered.start_minute::text) = any(ev.disabled_slots)
  order by ordered.slot_date, ordered.start_minute;
$$;

revoke all on function public.generate_event_slots(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_event — organiser publishes their wizard draft
-- ---------------------------------------------------------------------------

create or replace function public.create_event(
  p_title text,
  p_description text,
  p_location text,
  p_duration_minutes int,
  p_max_bookings int,
  p_requested_fields text[],
  p_send_email boolean,
  p_windows jsonb, -- [{date:'YYYY-MM-DD', from:'HH:MM', to:'HH:MM'}, ...]
  p_disabled_slots text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_slug text;
  v_event public.events%rowtype;
  w jsonb;
begin
  if p_title is null or btrim(p_title) = '' then
    raise exception 'title_required';
  end if;
  if p_duration_minutes is null or p_duration_minutes < 1 then
    raise exception 'invalid_duration';
  end if;
  if p_windows is null or jsonb_array_length(p_windows) = 0 then
    raise exception 'windows_required';
  end if;

  v_base := trim(both '-' from lower(regexp_replace(btrim(p_title), '[^a-zA-Z0-9]+', '-', 'g')));
  if v_base = '' then v_base := 'event'; end if;
  v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);

  insert into public.events (
    slug, title, description, location, duration_minutes, max_bookings,
    requested_fields, send_email, disabled_slots
  ) values (
    v_slug, btrim(p_title), coalesce(p_description, ''), coalesce(p_location, ''),
    p_duration_minutes, p_max_bookings, coalesce(p_requested_fields, '{}'),
    coalesce(p_send_email, true), coalesce(p_disabled_slots, '{}')
  ) returning * into v_event;

  for w in select * from jsonb_array_elements(p_windows) loop
    insert into public.availability_windows (event_id, date, start_minute, end_minute)
    values (
      v_event.id,
      (w ->> 'date')::date,
      split_part(w ->> 'from', ':', 1)::int * 60 + split_part(w ->> 'from', ':', 2)::int,
      split_part(w ->> 'to', ':', 1)::int * 60 + split_part(w ->> 'to', ':', 2)::int
    );
  end loop;

  return jsonb_build_object('id', v_event.id, 'slug', v_event.slug, 'organiserToken', v_event.organiser_token);
end;
$$;

grant execute on function public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_public_event — the public booking page's event + open slots
-- ---------------------------------------------------------------------------

create or replace function public.get_public_event(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_slots jsonb;
begin
  select * into v_event from public.events where slug = p_slug;
  if not found then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'date', g.slot_date,
    'start', g.start_minute,
    'end', g.end_minute,
    'taken', exists(
      select 1 from public.bookings b
      where b.event_id = v_event.id and b.status = 'booked'
        and b.slot_date = g.slot_date and b.slot_start_minute = g.start_minute
    )
  ) order by g.slot_date, g.start_minute), '[]'::jsonb)
  into v_slots
  from public.generate_event_slots(v_event.id) g;

  return jsonb_build_object(
    'slug', v_event.slug,
    'title', v_event.title,
    'description', v_event.description,
    'location', v_event.location,
    'durationMinutes', v_event.duration_minutes,
    'requestedFields', to_jsonb(v_event.requested_fields),
    'sendEmail', v_event.send_email,
    'slots', v_slots
  );
end;
$$;

grant execute on function public.get_public_event(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- book_slot
-- ---------------------------------------------------------------------------

create or replace function public.book_slot(
  p_slug text,
  p_date date,
  p_start_minute int,
  p_name text,
  p_email text,
  p_extra_fields jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_end int;
  v_booking public.bookings%rowtype;
begin
  select * into v_event from public.events where slug = p_slug;
  if not found then raise exception 'event_not_found'; end if;

  if p_name is null or btrim(p_name) = '' then raise exception 'name_required'; end if;
  if p_email is null or btrim(p_email) = '' then raise exception 'email_required'; end if;

  select g.end_minute into v_end
  from public.generate_event_slots(v_event.id) g
  where g.slot_date = p_date and g.start_minute = p_start_minute;
  if not found then raise exception 'slot_not_available'; end if;

  begin
    insert into public.bookings (event_id, slot_date, slot_start_minute, slot_end_minute, name, email, extra_fields)
    values (v_event.id, p_date, p_start_minute, v_end, btrim(p_name), lower(btrim(p_email)), coalesce(p_extra_fields, '{}'::jsonb))
    returning * into v_booking;
  exception when unique_violation then
    raise exception 'slot_already_booked';
  end;

  return jsonb_build_object(
    'manageToken', v_booking.manage_token,
    'status', v_booking.status,
    'name', v_booking.name,
    'email', v_booking.email,
    'extraFields', v_booking.extra_fields,
    'slot', jsonb_build_object('date', v_booking.slot_date, 'start', v_booking.slot_start_minute, 'end', v_booking.slot_end_minute),
    'prevSlot', null,
    'event', jsonb_build_object(
      'title', v_event.title, 'location', v_event.location, 'durationMinutes', v_event.duration_minutes,
      'sendEmail', v_event.send_email, 'slug', v_event.slug
    )
  );
end;
$$;

grant execute on function public.book_slot(text, date, int, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_booking — the booker's private manage-link screen
-- ---------------------------------------------------------------------------

create or replace function public.get_booking(p_manage_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_event public.events%rowtype;
begin
  select * into v_booking from public.bookings where manage_token = p_manage_token;
  if not found then return null; end if;
  select * into v_event from public.events where id = v_booking.event_id;

  return jsonb_build_object(
    'manageToken', v_booking.manage_token,
    'status', v_booking.status,
    'name', v_booking.name,
    'email', v_booking.email,
    'extraFields', v_booking.extra_fields,
    'slot', case when v_booking.status = 'booked' then
      jsonb_build_object('date', v_booking.slot_date, 'start', v_booking.slot_start_minute, 'end', v_booking.slot_end_minute)
    else null end,
    'prevSlot', case when v_booking.rescheduled_from_date is not null then
      jsonb_build_object(
        'date', v_booking.rescheduled_from_date,
        'start', v_booking.rescheduled_from_start_minute,
        'end', v_booking.rescheduled_from_start_minute + v_event.duration_minutes
      )
    else null end,
    'event', jsonb_build_object(
      'title', v_event.title, 'location', v_event.location, 'durationMinutes', v_event.duration_minutes,
      'sendEmail', v_event.send_email, 'slug', v_event.slug
    )
  );
end;
$$;

grant execute on function public.get_booking(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- reschedule_booking
-- ---------------------------------------------------------------------------

create or replace function public.reschedule_booking(p_manage_token uuid, p_date date, p_start_minute int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_event public.events%rowtype;
  v_end int;
begin
  select * into v_booking from public.bookings where manage_token = p_manage_token;
  if not found then raise exception 'booking_not_found'; end if;
  if v_booking.status <> 'booked' then raise exception 'booking_not_active'; end if;
  select * into v_event from public.events where id = v_booking.event_id;

  select g.end_minute into v_end
  from public.generate_event_slots(v_event.id) g
  where g.slot_date = p_date and g.start_minute = p_start_minute;
  if not found then raise exception 'slot_not_available'; end if;

  begin
    update public.bookings set
      rescheduled_from_date = v_booking.slot_date,
      rescheduled_from_start_minute = v_booking.slot_start_minute,
      slot_date = p_date,
      slot_start_minute = p_start_minute,
      slot_end_minute = v_end,
      updated_at = now()
    where id = v_booking.id
    returning * into v_booking;
  exception when unique_violation then
    raise exception 'slot_already_booked';
  end;

  return jsonb_build_object(
    'manageToken', v_booking.manage_token,
    'status', v_booking.status,
    'name', v_booking.name,
    'email', v_booking.email,
    'extraFields', v_booking.extra_fields,
    'slot', jsonb_build_object('date', v_booking.slot_date, 'start', v_booking.slot_start_minute, 'end', v_booking.slot_end_minute),
    'prevSlot', jsonb_build_object(
      'date', v_booking.rescheduled_from_date,
      'start', v_booking.rescheduled_from_start_minute,
      'end', v_booking.rescheduled_from_start_minute + v_event.duration_minutes
    ),
    'event', jsonb_build_object(
      'title', v_event.title, 'location', v_event.location, 'durationMinutes', v_event.duration_minutes,
      'sendEmail', v_event.send_email, 'slug', v_event.slug
    )
  );
end;
$$;

grant execute on function public.reschedule_booking(uuid, date, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- cancel_booking
-- ---------------------------------------------------------------------------

create or replace function public.cancel_booking(p_manage_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_event public.events%rowtype;
begin
  select * into v_booking from public.bookings where manage_token = p_manage_token;
  if not found then raise exception 'booking_not_found'; end if;
  if v_booking.status <> 'booked' then raise exception 'booking_not_active'; end if;
  select * into v_event from public.events where id = v_booking.event_id;

  update public.bookings set
    rescheduled_from_date = slot_date,
    rescheduled_from_start_minute = slot_start_minute,
    slot_date = null,
    slot_start_minute = null,
    slot_end_minute = null,
    status = 'cancelled',
    updated_at = now()
  where id = v_booking.id
  returning * into v_booking;

  return jsonb_build_object(
    'manageToken', v_booking.manage_token,
    'status', v_booking.status,
    'name', v_booking.name,
    'email', v_booking.email,
    'extraFields', v_booking.extra_fields,
    'slot', null,
    'prevSlot', jsonb_build_object(
      'date', v_booking.rescheduled_from_date,
      'start', v_booking.rescheduled_from_start_minute,
      'end', v_booking.rescheduled_from_start_minute + v_event.duration_minutes
    ),
    'event', jsonb_build_object(
      'title', v_event.title, 'location', v_event.location, 'durationMinutes', v_event.duration_minutes,
      'sendEmail', v_event.send_email, 'slug', v_event.slug
    )
  );
end;
$$;

grant execute on function public.cancel_booking(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_organiser_dashboard — gated by the private organiser_token link
-- ---------------------------------------------------------------------------

create or replace function public.get_organiser_dashboard(p_organiser_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_seat_booked jsonb;
  v_total int;
  v_booked int;
begin
  select * into v_event from public.events where organiser_token = p_organiser_token;
  if not found then return null; end if;

  select
    coalesce(jsonb_agg(exists(
      select 1 from public.bookings b
      where b.event_id = v_event.id and b.status = 'booked'
        and b.slot_date = g.slot_date and b.slot_start_minute = g.start_minute
    ) order by g.slot_date, g.start_minute), '[]'::jsonb),
    count(*)
  into v_seat_booked, v_total
  from public.generate_event_slots(v_event.id) g;

  select count(*) into v_booked from public.bookings where event_id = v_event.id and status = 'booked';

  return jsonb_build_object(
    'id', v_event.id,
    'slug', v_event.slug,
    'organiserToken', v_event.organiser_token,
    'title', v_event.title,
    'description', v_event.description,
    'location', v_event.location,
    'durationMinutes', v_event.duration_minutes,
    'maxBookings', v_event.max_bookings,
    'requestedFields', to_jsonb(v_event.requested_fields),
    'sendEmail', v_event.send_email,
    'totalSlots', v_total,
    'availableSlots', v_total - v_booked,
    'bookedCount', v_booked,
    'seatBooked', v_seat_booked
  );
end;
$$;

grant execute on function public.get_organiser_dashboard(uuid) to anon, authenticated;
