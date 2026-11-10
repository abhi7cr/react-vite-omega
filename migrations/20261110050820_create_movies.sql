-- create movies
create table public.movies (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  title      text not null,
  rating     smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index movies_owner_idx on public.movies (owner_id);

alter table public.movies enable row level security;

create policy "movies_select_own" on public.movies for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "movies_insert_own" on public.movies for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "movies_update_own" on public.movies for update
  to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "movies_delete_own" on public.movies for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, update, delete on public.movies to authenticated;
