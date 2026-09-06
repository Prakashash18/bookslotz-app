-- Adds a `bookings` array (name, email, extra fields, slot, status) to the
-- organiser dashboard RPCs, so an organiser can actually see who booked
-- what — previously only aggregate counts + seat dots were exposed.

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
  v_bookings jsonb;
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', b.name,
    'email', b.email,
    'extraFields', b.extra_fields,
    'status', b.status,
    'slot', case when b.status = 'booked' then
      jsonb_build_object('date', b.slot_date, 'start', b.slot_start_minute, 'end', b.slot_end_minute)
    else null end
  ) order by coalesce(b.slot_date, b.rescheduled_from_date), coalesce(b.slot_start_minute, b.rescheduled_from_start_minute)), '[]'::jsonb)
  into v_bookings
  from public.bookings b
  where b.event_id = v_event.id;

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
    'seatBooked', v_seat_booked,
    'bookings', v_bookings
  );
end;
$$;

grant execute on function public.get_organiser_dashboard(uuid) to anon, authenticated;

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
  v_bookings jsonb;
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', b.name,
    'email', b.email,
    'extraFields', b.extra_fields,
    'status', b.status,
    'slot', case when b.status = 'booked' then
      jsonb_build_object('date', b.slot_date, 'start', b.slot_start_minute, 'end', b.slot_end_minute)
    else null end
  ) order by coalesce(b.slot_date, b.rescheduled_from_date), coalesce(b.slot_start_minute, b.rescheduled_from_start_minute)), '[]'::jsonb)
  into v_bookings
  from public.bookings b
  where b.event_id = v_event.id;

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
    'seatBooked', v_seat_booked,
    'bookings', v_bookings
  );
end;
$$;

grant execute on function public.get_event_for_organiser(uuid) to authenticated;
