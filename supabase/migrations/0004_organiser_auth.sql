-- Organiser accounts (Supabase Auth), additive to the existing organiser_token
-- link. Bookers stay login-free — this only affects the organiser side.
--
-- events.organiser_id ties an event to a real account when one is
-- authenticated at creation time; organiser_token keeps working for any
-- event created before this migration (or without an account). New RPCs
-- gated on auth.uid() give a logged-in organiser a real "my events" list
-- instead of needing to bookmark a secret-token URL.

alter table public.events add column organiser_id uuid references auth.users(id);
create index events_organiser_id_idx on public.events(organiser_id);

-- create_event: attach the caller's account automatically when authenticated.

drop function if exists public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[], text);

create or replace function public.create_event(
  p_title text,
  p_description text,
  p_location text,
  p_duration_minutes int,
  p_max_bookings int,
  p_requested_fields text[],
  p_send_email boolean,
  p_windows jsonb,
  p_disabled_slots text[],
  p_organiser_email text default null
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
    requested_fields, send_email, disabled_slots, organiser_email, organiser_id
  ) values (
    v_slug, btrim(p_title), coalesce(p_description, ''), coalesce(p_location, ''),
    p_duration_minutes, p_max_bookings, coalesce(p_requested_fields, '{}'),
    coalesce(p_send_email, true), coalesce(p_disabled_slots, '{}'),
    nullif(btrim(coalesce(p_organiser_email, '')), ''),
    auth.uid()
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

grant execute on function public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[], text) to anon, authenticated;

-- list_my_events: every event owned by the logged-in account, with counts.

create or replace function public.list_my_events()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'slug', e.slug,
    'title', e.title,
    'durationMinutes', e.duration_minutes,
    'totalSlots', (select count(*) from public.generate_event_slots(e.id)),
    'bookedCount', (select count(*) from public.bookings b where b.event_id = e.id and b.status = 'booked'),
    'createdAt', e.created_at
  ) order by e.created_at desc), '[]'::jsonb)
  into v_out
  from public.events e
  where e.organiser_id = v_uid;

  return v_out;
end;
$$;

grant execute on function public.list_my_events() to authenticated;

-- get_event_for_organiser: same shape as get_organiser_dashboard, gated by
-- account ownership instead of a token — the logged-in-organiser path.

create or replace function public.get_event_for_organiser(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events%rowtype;
  v_seat_booked jsonb;
  v_total int;
  v_booked int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_event from public.events where id = p_event_id and organiser_id = v_uid;
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

grant execute on function public.get_event_for_organiser(uuid) to authenticated;
