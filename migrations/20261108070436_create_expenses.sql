-- create expenses
create table public.expenses (
  id          bigint generated always as identity primary key,
  owner_id    text not null default auth.uid(),      -- auth.uid() returns text
  description text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  created_at  timestamptz not null default now()
);

create index expenses_owner_idx on public.expenses (owner_id);

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "expenses_insert_own" on public.expenses for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "expenses_delete_own" on public.expenses for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.expenses to authenticated;
