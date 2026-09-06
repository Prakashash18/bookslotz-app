-- A public, read-only "who's booked" roster the organiser can share with
-- their class. Deliberately its own narrow function, not a variant of
-- get_public_event: it must never expose email addresses or manage
-- tokens, only what's needed to answer "who's in which slot" — name,
-- the slot itself, and whatever extra fields the organiser asked for
-- (e.g. "Group / Team"), which are not treated as private.

create or replace function public.get_public_roster(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_rows jsonb;
begin
  select * into v_event from public.events where slug = p_slug;
  if not found then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', b.name,
    'extraFields', b.extra_fields,
    'slot', jsonb_build_object('date', b.slot_date, 'start', b.slot_start_minute, 'end', b.slot_end_minute)
  ) order by b.slot_date, b.slot_start_minute), '[]'::jsonb)
  into v_rows
  from public.bookings b
  where b.event_id = v_event.id and b.status = 'booked';

  return jsonb_build_object(
    'title', v_event.title,
    'durationMinutes', v_event.duration_minutes,
    'rows', v_rows
  );
end;
$$;

grant execute on function public.get_public_roster(text) to anon, authenticated;
