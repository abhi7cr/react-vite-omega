-- create workouts
create table public.workouts (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  activity   text not null,
  minutes    integer not null check (minutes > 0),
  created_at timestamptz not null default now()
);

create index workouts_owner_idx on public.workouts (owner_id);

alter table public.workouts enable row level security;

create policy "workouts_select_own" on public.workouts for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "workouts_insert_own" on public.workouts for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "workouts_delete_own" on public.workouts for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.workouts to authenticated;
