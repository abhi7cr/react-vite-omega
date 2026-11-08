-- create contacts
create table public.contacts (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  name       text not null,
  email      text,
  created_at timestamptz not null default now()
);

create index contacts_owner_idx on public.contacts (owner_id);

alter table public.contacts enable row level security;

create policy "contacts_select_own" on public.contacts for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "contacts_insert_own" on public.contacts for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "contacts_delete_own" on public.contacts for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, delete on public.contacts to authenticated;
