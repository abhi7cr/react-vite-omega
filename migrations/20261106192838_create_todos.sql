-- create todos
create table public.todos (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  title      text not null,
  completed  boolean not null default false,
  created_at timestamptz not null default now()
);

create index todos_owner_idx on public.todos (owner_id);

alter table public.todos enable row level security;

create policy "todos_select_own" on public.todos for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "todos_insert_own" on public.todos for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "todos_update_own" on public.todos for update
  to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "todos_delete_own" on public.todos for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, update, delete on public.todos to authenticated;
