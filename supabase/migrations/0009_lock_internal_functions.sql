-- 0009_lock_internal_functions.sql
-- Close browser access to the functions that were never meant to have it.
--
-- Two separate things grant EXECUTE on a new function here, and you have to
-- remove BOTH:
--   1. Postgres grants EXECUTE to PUBLIC on every new function by default.
--      `revoke ... from anon` does not take that away, because anon inherits
--      it through PUBLIC. The revokes in 0001, 0002 and 0008 that named only
--      anon/authenticated were therefore partial no-ops.
--   2. Supabase ships ALTER DEFAULT PRIVILEGES granting EXECUTE to
--      anon/authenticated/service_role, so every `create or replace function`
--      re-adds an explicit anon grant — including on functions an earlier
--      migration had locked down.
--
-- Consequence while both were in force: PostgREST exposed these to anyone
-- holding the publishable key, which ships in the JS bundle. The one that
-- mattered is send_booking_email(to, subject, html) — it reads the Resend key
-- out of the vault and sends arbitrary HTML from the verified sender address,
-- i.e. an open mail relay on this project's own domain.
--
-- WARNING for future migrations: any `create or replace` of a function below
-- silently re-grants anon. Re-run the matching revoke in the same migration.
--
-- Revoking is safe for internal callers — every caller is a SECURITY DEFINER
-- function owned by postgres, which keeps its own explicit grant.

-- ---------------------------------------------------------------------------
-- Internal only: never reachable over PostgREST
-- ---------------------------------------------------------------------------
revoke all on function public.send_booking_email(text, text, text) from public, anon, authenticated;
revoke all on function public.generate_event_slots(uuid)           from public, anon, authenticated;
revoke all on function public.fmt_slot_day(date)                   from public, anon, authenticated;
revoke all on function public.fmt_slot_time(integer)               from public, anon, authenticated;
revoke all on function public.is_pro(uuid)                         from public, anon, authenticated;
revoke all on function public.free_event_limit()                   from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signed-in organisers only
-- ---------------------------------------------------------------------------
-- These already raise not_authenticated when auth.uid() is null, so closing
-- anon is defence in depth rather than a fix.
revoke all on function public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[], text) from public, anon;
revoke all on function public.list_my_events()                     from public, anon;
revoke all on function public.get_event_for_organiser(uuid)        from public, anon;
revoke all on function public.get_my_plan()                        from public, anon;

grant execute on function public.create_event(text, text, text, int, int, text[], boolean, jsonb, text[], text) to authenticated;
grant execute on function public.list_my_events()                  to authenticated;
grant execute on function public.get_event_for_organiser(uuid)     to authenticated;
grant execute on function public.get_my_plan()                     to authenticated;
