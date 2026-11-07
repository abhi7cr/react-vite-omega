-- create notes
create table public.notes (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  body       text not null,
  created_at timestamptz not null default now()
);

create index notes_owner_idx on public.notes (owner_id);

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "notes_insert_own" on public.notes for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "notes_delete_own" on public.notes for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.notes to authenticated;
