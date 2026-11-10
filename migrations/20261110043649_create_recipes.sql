-- create recipes
create table public.recipes (
  id           bigint generated always as identity primary key,
  owner_id     text not null default auth.uid(),      -- auth.uid() returns text
  name         text not null,
  prep_minutes integer check (prep_minutes > 0),
  created_at   timestamptz not null default now()
);

create index recipes_owner_idx on public.recipes (owner_id);

alter table public.recipes enable row level security;

create policy "recipes_select_own" on public.recipes for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "recipes_insert_own" on public.recipes for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "recipes_delete_own" on public.recipes for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.recipes to authenticated;
