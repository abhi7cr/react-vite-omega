-- create quotes
create table public.quotes (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  body       text not null,
  author     text,
  created_at timestamptz not null default now()
);

create index quotes_owner_idx on public.quotes (owner_id);

alter table public.quotes enable row level security;

create policy "quotes_select_own" on public.quotes for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "quotes_insert_own" on public.quotes for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "quotes_delete_own" on public.quotes for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.quotes to authenticated;
