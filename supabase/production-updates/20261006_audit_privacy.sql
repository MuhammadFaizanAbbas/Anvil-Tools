-- Incremental update for the existing production schema. Preserve archive data.
begin;
do $$
begin
  if not exists (select 1 from pg_class where oid = 'public.posts_removed_backup'::regclass and relrowsecurity) then
    raise exception 'Expected backup RLS is missing';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'own_profile' and cmd = 'SELECT' and roles = array['authenticated']::name[]) then
    raise exception 'Expected own-profile read policy is missing';
  end if;
end $$;
revoke all privileges on table public.posts_removed_backup from anon, authenticated, public;
alter policy own_profile on public.profiles using (id = (select auth.uid()));
commit;
