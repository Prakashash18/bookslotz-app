-- Lets the organiser cancel a booking directly (emergency use — a booker
-- can't always be reached to do it themselves) and always notifies the
-- booker by email when this happens, regardless of the event's general
-- send_email toggle: silently cancelling someone's slot out from under
-- them is exactly the case that must never go unnoticed.

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
    'id', b.id,
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
    'id', b.id,
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

-- organiser_cancel_booking: authorized via EITHER the event's organiser_token
-- (legacy / no-login path) OR auth.uid() = event.organiser_id (account path)
-- — mirrors the same two access paths the rest of the organiser side uses.

create or replace function public.organiser_cancel_booking(
  p_booking_id uuid,
  p_organiser_token uuid default null,
  p_site_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_event public.events%rowtype;
  v_book_url text;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then raise exception 'booking_not_found'; end if;
  select * into v_event from public.events where id = v_booking.event_id;

  if p_organiser_token is not null then
    if v_event.organiser_token <> p_organiser_token then
      raise exception 'not_authorized';
    end if;
  elsif auth.uid() is null or v_event.organiser_id is null or v_event.organiser_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;

  if v_booking.status <> 'booked' then raise exception 'booking_not_active'; end if;

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

  -- Always notify — this bypasses the event's send_email toggle deliberately.
  v_book_url := coalesce(p_site_url, '') || '/b/' || v_event.slug;
  perform public.send_booking_email(
    v_booking.email,
    'Your booking was cancelled — ' || v_event.title,
    '<p>Hi ' || v_booking.name || ',</p>' ||
    '<p>The organiser has cancelled your booking for <strong>' || v_event.title || '</strong> (' ||
    public.fmt_slot_day(v_booking.rescheduled_from_date) || ', ' ||
    public.fmt_slot_time(v_booking.rescheduled_from_start_minute) || ').</p>' ||
    '<p>If you still need a time, you can book another one.</p>' ||
    '<p><a href="' || v_book_url || '">Choose another time</a></p>'
  );

  return jsonb_build_object('id', v_booking.id, 'status', v_booking.status);
end;
$$;

grant execute on function public.organiser_cancel_booking(uuid, uuid, text) to anon, authenticated;
