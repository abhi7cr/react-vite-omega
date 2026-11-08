-- create bookmarks
create table public.bookmarks (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  title      text not null,
  url        text not null check (url ~* '^https?://'),
  created_at timestamptz not null default now()
);

create index bookmarks_owner_idx on public.bookmarks (owner_id);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.bookmarks to authenticated;
