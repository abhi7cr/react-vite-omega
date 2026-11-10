-- create shopping items
create table public.shopping_items (
  id         bigint generated always as identity primary key,
  owner_id   text not null default auth.uid(),      -- auth.uid() returns text
  name       text not null,
  quantity   integer not null default 1 check (quantity > 0),
  bought     boolean not null default false,
  created_at timestamptz not null default now()
);

create index shopping_items_owner_idx on public.shopping_items (owner_id);

alter table public.shopping_items enable row level security;

create policy "shopping_items_select_own" on public.shopping_items for select
  to authenticated using ((select auth.uid()) = owner_id);
create policy "shopping_items_insert_own" on public.shopping_items for insert
  to authenticated with check ((select auth.uid()) = owner_id);
create policy "shopping_items_update_own" on public.shopping_items for update
  to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "shopping_items_delete_own" on public.shopping_items for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- The Data API reaches a table only after a grant; RLS then filters rows.
grant select, insert, update, delete on public.shopping_items to authenticated;
