-- create habits
create table public.habits (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  name       text not null,
  check_ins  integer not null default 0 check (check_ins >= 0),
  created_at timestamptz not null default now()
);

create index habits_owner_idx on public.habits (owner_id);

alter table public.habits enable row level security;

create policy "habits_select_own" on public.habits for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "habits_insert_own" on public.habits for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "habits_update_own" on public.habits for update
  to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "habits_delete_own" on public.habits for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, update, delete on public.habits to authenticated;
