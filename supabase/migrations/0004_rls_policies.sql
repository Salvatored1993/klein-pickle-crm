-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select
  using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- role/is_active can only change through the admin_set_role / admin_set_active
-- security-definer functions above, not a direct column update.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- products
alter table public.products enable row level security;

create policy "products_select" on public.products
  for select
  using (auth.role() = 'authenticated');

create policy "products_admin_write" on public.products
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- leads
alter table public.leads enable row level security;

create policy "leads_select" on public.leads
  for select
  using (public.can_see_lead(id));

create policy "leads_insert" on public.leads
  for insert
  with check (
    public.is_admin()
    or salesperson_id = auth.uid()
  );

create policy "leads_update" on public.leads
  for update
  using (public.is_admin() or salesperson_id = auth.uid())
  with check (public.is_admin() or salesperson_id = auth.uid());

-- no delete policy: leads are closed out via sales_stage = 'Lost', never removed

-- lead_products
alter table public.lead_products enable row level security;

create policy "lead_products_select" on public.lead_products
  for select
  using (public.can_see_lead(lead_id));

create policy "lead_products_insert" on public.lead_products
  for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.leads
      where id = lead_id and salesperson_id = auth.uid()
    )
  );

create policy "lead_products_delete" on public.lead_products
  for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.leads
      where id = lead_id and salesperson_id = auth.uid()
    )
  );

-- tasks
alter table public.tasks enable row level security;

create policy "tasks_select" on public.tasks
  for select
  using (public.can_see_lead(lead_id));

create policy "tasks_insert" on public.tasks
  for insert
  with check (public.can_see_lead(lead_id));

create policy "tasks_update" on public.tasks
  for update
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or created_by = auth.uid()
    or exists (
      select 1 from public.leads
      where id = lead_id and salesperson_id = auth.uid()
    )
  )
  with check (public.can_see_lead(lead_id));

-- lead_activity (comments + system-logged history — immutable, no update/delete policy)
alter table public.lead_activity enable row level security;

create policy "lead_activity_select" on public.lead_activity
  for select
  using (public.can_see_lead(lead_id));

create policy "lead_activity_insert" on public.lead_activity
  for insert
  with check (public.can_see_lead(lead_id));
