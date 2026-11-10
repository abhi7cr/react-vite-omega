-- create journal entries
create table public.journal_entries (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  body       text not null,
  mood       text not null default 'okay' check (mood in ('great', 'good', 'okay', 'bad')),
  created_at timestamptz not null default now()
);

create index journal_entries_owner_idx on public.journal_entries (owner_id);

alter table public.journal_entries enable row level security;

create policy "journal_entries_select_own" on public.journal_entries for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "journal_entries_insert_own" on public.journal_entries for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "journal_entries_delete_own" on public.journal_entries for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.journal_entries to authenticated;
