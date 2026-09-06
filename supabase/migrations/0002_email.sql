-- Confirmation emails, sent from Postgres via pg_net + Resend.
-- The API key lives in Supabase Vault (never in source, never in a client-
-- visible column); send_booking_email is not itself grantable to
-- anon/authenticated — only the booking RPCs below call it, and only when
-- the organiser opted in (events.send_email).

create extension if not exists pg_net;

create or replace function public.send_booking_email(p_to text, p_subject text, p_html text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then
    raise warning 'resend_api_key not configured in vault; skipping email to %', p_to;
    return;
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'BookSlot <bookings@coastalpatrol.app>',
      'to', jsonb_build_array(p_to),
      'subject', p_subject,
      'html', p_html
    )
  );
exception when others then
  -- An email hiccup must never break a booking/reschedule/cancel transaction.
  raise warning 'send_booking_email failed for %: %', p_to, sqlerrm;
end;
$$;

revoke all on function public.send_booking_email(text, text, text) from anon, authenticated;

create or replace function public.fmt_slot_day(p_date date)
returns text language sql immutable as $$
  select to_char(p_date, 'FMDay, FMDD FMMonth YYYY');
$$;

create or replace function public.fmt_slot_time(p_minute int)
returns text language sql immutable as $$
  select to_char(time '00:00' + (p_minute || ' minutes')::interval, 'FMHH12:MI AM');
$$;

-- ---------------------------------------------------------------------------
-- book_slot — now takes p_site_url so the confirmation email can link back
-- to the booker's private manage page.
-- ---------------------------------------------------------------------------

drop function if exists public.book_slot(text, date, int, text, text, jsonb);

create or replace function public.book_slot(
  p_slug text,
  p_date date,
  p_start_minute int,
  p_name text,
  p_email text,
  p_extra_fields jsonb,
  p_site_url text default null
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
  v_manage_url text;
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

  if v_event.send_email then
    v_manage_url := coalesce(p_site_url, '') || '/b/' || v_event.slug || '/m/' || v_booking.manage_token;
    perform public.send_booking_email(
      v_booking.email,
      'You''re booked — ' || v_event.title,
      '<p>Hi ' || v_booking.name || ',</p>' ||
      '<p>You''re booked for <strong>' || v_event.title || '</strong>.</p>' ||
      '<p>' || public.fmt_slot_day(v_booking.slot_date) || '<br>' ||
      public.fmt_slot_time(v_booking.slot_start_minute) || ' – ' || public.fmt_slot_time(v_booking.slot_end_minute) ||
      '<br>' || v_event.location || '</p>' ||
      '<p><a href="' || v_manage_url || '">Change or cancel this booking</a></p>'
    );
  end if;

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

grant execute on function public.book_slot(text, date, int, text, text, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- reschedule_booking — same p_site_url addition
-- ---------------------------------------------------------------------------

drop function if exists public.reschedule_booking(uuid, date, int);

create or replace function public.reschedule_booking(
  p_manage_token uuid,
  p_date date,
  p_start_minute int,
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
  v_end int;
  v_manage_url text;
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

  if v_event.send_email then
    v_manage_url := coalesce(p_site_url, '') || '/b/' || v_event.slug || '/m/' || v_booking.manage_token;
    perform public.send_booking_email(
      v_booking.email,
      'Your time has moved — ' || v_event.title,
      '<p>Hi ' || v_booking.name || ',</p>' ||
      '<p>Your booking for <strong>' || v_event.title || '</strong> has moved.</p>' ||
      '<p>Was: <s>' || public.fmt_slot_day(v_booking.rescheduled_from_date) || ', ' ||
        public.fmt_slot_time(v_booking.rescheduled_from_start_minute) || '</s></p>' ||
      '<p>Now: <strong>' || public.fmt_slot_day(v_booking.slot_date) || '<br>' ||
      public.fmt_slot_time(v_booking.slot_start_minute) || ' – ' || public.fmt_slot_time(v_booking.slot_end_minute) ||
      '</strong><br>' || v_event.location || '</p>' ||
      '<p><a href="' || v_manage_url || '">View or change this booking</a></p>'
    );
  end if;

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

grant execute on function public.reschedule_booking(uuid, date, int, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- cancel_booking — same p_site_url addition
-- ---------------------------------------------------------------------------

drop function if exists public.cancel_booking(uuid);

create or replace function public.cancel_booking(p_manage_token uuid, p_site_url text default null)
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

  if v_event.send_email then
    v_book_url := coalesce(p_site_url, '') || '/b/' || v_event.slug;
    perform public.send_booking_email(
      v_booking.email,
      'Booking cancelled — ' || v_event.title,
      '<p>Hi ' || v_booking.name || ',</p>' ||
      '<p>Your booking for <strong>' || v_event.title || '</strong> (' ||
      public.fmt_slot_day(v_booking.rescheduled_from_date) || ', ' ||
      public.fmt_slot_time(v_booking.rescheduled_from_start_minute) || ') has been cancelled.</p>' ||
      '<p><a href="' || v_book_url || '">Choose another time</a></p>'
    );
  end if;

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

grant execute on function public.cancel_booking(uuid, text) to anon, authenticated;
