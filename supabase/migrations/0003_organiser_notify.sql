-- Organiser notification email: an optional address the organiser gives at
-- publish time. When set, book_slot emails them ("New booking — <title>")
-- alongside the booker's own confirmation. Presence of the address is the
-- opt-in — no separate boolean needed.

alter table public.events add column organiser_email text;

drop function if exists public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[]);

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
    requested_fields, send_email, disabled_slots, organiser_email
  ) values (
    v_slug, btrim(p_title), coalesce(p_description, ''), coalesce(p_location, ''),
    p_duration_minutes, p_max_bookings, coalesce(p_requested_fields, '{}'),
    coalesce(p_send_email, true), coalesce(p_disabled_slots, '{}'),
    nullif(btrim(coalesce(p_organiser_email, '')), '')
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

-- book_slot: notify the organiser (if they gave an email) in addition to
-- confirming with the booker.

drop function if exists public.book_slot(text, date, int, text, text, jsonb, text);

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
  v_extra_lines text;
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

  if v_event.organiser_email is not null then
    select coalesce(string_agg('<br>' || key || ': ' || value, ''), '')
    into v_extra_lines
    from jsonb_each_text(v_booking.extra_fields);

    perform public.send_booking_email(
      v_event.organiser_email,
      'New booking — ' || v_event.title,
      '<p><strong>' || v_booking.name || '</strong> (' || v_booking.email || ') just booked <strong>' || v_event.title || '</strong>.</p>' ||
      '<p>' || public.fmt_slot_day(v_booking.slot_date) || '<br>' ||
      public.fmt_slot_time(v_booking.slot_start_minute) || ' – ' || public.fmt_slot_time(v_booking.slot_end_minute) ||
      coalesce(v_extra_lines, '') || '</p>'
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
