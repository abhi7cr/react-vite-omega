-- create books
create table public.books (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  title      text not null,
  author     text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index books_owner_idx on public.books (owner_id);

alter table public.books enable row level security;

create policy "books_select_own" on public.books for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "books_insert_own" on public.books for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "books_update_own" on public.books for update
  to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "books_delete_own" on public.books for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, update, delete on public.books to authenticated;
