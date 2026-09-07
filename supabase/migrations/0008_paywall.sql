-- 0008_paywall.sql
-- A free tier with a hard limit, enforced in the database.
--
-- The whole security model of this app is "RLS with zero policies, everything
-- through SECURITY DEFINER RPCs", so the paywall belongs in the same place:
-- inside create_event, not in the React app. Hiding a button stops nobody —
-- the publishable key ships in the browser bundle and anyone can call the RPC
-- directly. This migration puts the check behind the same door as everything else.

-- ---------------------------------------------------------------------------
-- Who has paid
-- ---------------------------------------------------------------------------
-- Deliberately minimal: presence of a live row means Pro. At the manual stage
-- you add a row by hand when Stripe says someone paid; later a webhook writes
-- the same row. Nothing else in the app needs to change when that happens.
create table if not exists public.pro_accounts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  -- null means it never lapses (lifetime, comp, grandfathered)
  expires_at timestamptz,
  -- free text for your own bookkeeping: 'stripe cs_test_...', 'comp', ...
  note       text
);

alter table public.pro_accounts enable row level security;
revoke all on public.pro_accounts from anon, authenticated;

-- ---------------------------------------------------------------------------
-- The two facts the paywall is made of
-- ---------------------------------------------------------------------------

-- How many events a free account may own. One place to change the tier.
create or replace function public.free_event_limit()
returns int
language sql
immutable
as $$ select 1 $$;

revoke all on function public.free_event_limit() from anon, authenticated;

create or replace function public.is_pro(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pro_accounts p
    where p.user_id = p_user_id
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

revoke all on function public.is_pro(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- What the client is allowed to know about its own plan
-- ---------------------------------------------------------------------------
-- Lets the UI show the limit *before* someone fills in the whole wizard.
-- This is a courtesy, not a control — create_event enforces it regardless.
create or replace function public.get_my_plan()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_pro     boolean;
  v_expires timestamptz;
  v_count   int;
  v_limit   int := public.free_event_limit();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select (p.expires_at is null or p.expires_at > now()), p.expires_at
    into v_pro, v_expires
  from public.pro_accounts p
  where p.user_id = v_uid;

  v_pro := coalesce(v_pro, false);

  select count(*) into v_count
  from public.events e
  where e.organiser_id = v_uid;

  return jsonb_build_object(
    'isPro', v_pro,
    -- set when a plan exists, whether or not it is still live, so the UI can
    -- say "expired on ..." rather than just "not subscribed"
    'expiresAt', v_expires,
    'eventCount', v_count,
    'freeEventLimit', v_limit,
    'canCreateEvent', v_pro or v_count < v_limit
  );
end;
$$;

grant execute on function public.get_my_plan() to authenticated;

-- ---------------------------------------------------------------------------
-- The enforcement itself
-- ---------------------------------------------------------------------------
-- Two changes from 0004:
--   1. Sign-in is now required. Previously auth.uid() could be null and the
--      event was reachable by its ?ot= token alone — which would have made the
--      paywall a no-op (sign out, create freely). Nothing in the app used that
--      path; /new has been behind RequireAuth since 0004.
--   2. Free accounts are capped at free_event_limit() events.
--
-- Note what is NOT gated: book_slot, get_public_event, get_public_roster and
-- the dashboards stay open. A student must never be blocked because their
-- teacher's plan lapsed, and events that already exist keep taking bookings
-- forever. The gate is on creating, not on running.
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
  v_uid   uuid := auth.uid();
  v_base  text;
  v_slug  text;
  v_event public.events%rowtype;
  v_count int;
  v_limit int := public.free_event_limit();
  w jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'title_required';
  end if;
  if p_duration_minutes is null or p_duration_minutes < 1 then
    raise exception 'invalid_duration';
  end if;
  if p_windows is null or jsonb_array_length(p_windows) = 0 then
    raise exception 'windows_required';
  end if;

  if not public.is_pro(v_uid) then
    select count(*) into v_count
    from public.events e
    where e.organiser_id = v_uid;

    if v_count >= v_limit then
      raise exception 'event_limit_reached';
    end if;
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
    v_uid
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

-- Anonymous creation is closed; see note above.
revoke execute on function public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[], text) from anon;
grant execute on function public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- Nobody who already relies on this app gets locked out
-- ---------------------------------------------------------------------------
-- Every organiser who had created an event before the paywall existed keeps
-- unlimited access. Introducing a limit that retroactively breaks people who
-- were using the thing for free is how you lose them.
insert into public.pro_accounts (user_id, note)
select distinct e.organiser_id, 'grandfathered: organiser at paywall launch'
from public.events e
where e.organiser_id is not null
on conflict (user_id) do nothing;
