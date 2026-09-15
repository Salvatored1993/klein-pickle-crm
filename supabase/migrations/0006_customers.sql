-- Generalize tasks/lead_activity so they can attach to either a lead or a
-- customer account, and add the customer + check-in cadence system.
-- Safe to drop/recreate: no rows exist in these tables yet.

drop table if exists public.lead_activity cascade;
drop table if exists public.tasks cascade;
drop type if exists activity_type;

create type activity_type as enum (
  'comment',
  'stage_change',
  'lead_created',
  'checkin',
  'customer_created'
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  salesperson_id uuid not null references public.profiles (id),
  company_name text not null,
  primary_contact_name text,
  contact_email text,
  contact_phone text,
  ship_to_locations text,
  customer_type customer_type,
  distributor text,
  notes text,
  is_active boolean not null default true,
  checkin_frequency_days smallint not null default 30 check (checkin_frequency_days > 0),
  last_contact_date date not null default current_date,
  next_action text,
  next_checkin_date date not null default (current_date + 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_salesperson_id_idx on public.customers (salesperson_id);
create index customers_next_checkin_date_idx on public.customers (next_checkin_date);

create table public.customer_products (
  customer_id uuid not null references public.customers (id) on delete cascade,
  product_id uuid not null references public.products (id),
  primary key (customer_id, product_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  status task_status not null default 'Open',
  priority task_priority not null default 'Medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint tasks_one_target check (
    (lead_id is not null and customer_id is null)
    or (lead_id is null and customer_id is not null)
  )
);

create index tasks_lead_id_idx on public.tasks (lead_id);
create index tasks_customer_id_idx on public.tasks (customer_id);
create index tasks_assigned_to_idx on public.tasks (assigned_to);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete cascade,
  author_id uuid references public.profiles (id),
  activity_type activity_type not null default 'comment',
  body text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint activity_one_target check (
    (lead_id is not null and customer_id is null)
    or (lead_id is null and customer_id is not null)
  )
);

create index activity_lead_id_idx on public.activity (lead_id);
create index activity_customer_id_idx on public.activity (customer_id);

-- helper functions: can_see_lead now points at `activity` instead of the
-- dropped `lead_activity`, and can_see_customer mirrors the same shape.
create or replace function public.can_see_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.leads
      where id = target_lead_id and salesperson_id = auth.uid()
    )
    or exists (
      select 1 from public.tasks
      where lead_id = target_lead_id and assigned_to = auth.uid()
    )
    or exists (
      select 1 from public.activity
      where lead_id = target_lead_id and author_id = auth.uid()
    );
$$;

create or replace function public.can_see_customer(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.customers
      where id = target_customer_id and salesperson_id = auth.uid()
    )
    or exists (
      select 1 from public.tasks
      where customer_id = target_customer_id and assigned_to = auth.uid()
    )
    or exists (
      select 1 from public.activity
      where customer_id = target_customer_id and author_id = auth.uid()
    );
$$;

-- lead trigger function now targets `activity` (table name only change)
create or replace function public.log_lead_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity (lead_id, author_id, activity_type, metadata)
    values (new.id, new.salesperson_id, 'lead_created', jsonb_build_object('company_name', new.company_name));
  elsif tg_op = 'UPDATE' and new.sales_stage is distinct from old.sales_stage then
    insert into public.activity (lead_id, author_id, activity_type, metadata)
    values (new.id, auth.uid(), 'stage_change', jsonb_build_object('from_stage', old.sales_stage, 'to_stage', new.sales_stage));
  end if;
  return new;
end;
$$;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create or replace function public.log_customer_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity (customer_id, author_id, activity_type, metadata)
  values (new.id, new.salesperson_id, 'customer_created', jsonb_build_object('company_name', new.company_name));
  return new;
end;
$$;

create trigger customers_log_activity
  after insert on public.customers
  for each row execute function public.log_customer_activity();

-- any comment/checkin logged against a customer resets the check-in clock
create or replace function public.update_customer_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is not null and new.activity_type in ('comment', 'checkin') then
    update public.customers
    set last_contact_date = current_date,
        next_checkin_date = current_date + checkin_frequency_days
    where id = new.customer_id;
  end if;
  return new;
end;
$$;

create trigger activity_update_customer_checkin
  after insert on public.activity
  for each row execute function public.update_customer_checkin();

-- RLS: customers
alter table public.customers enable row level security;

create policy "customers_select" on public.customers
  for select
  using (public.can_see_customer(id));

create policy "customers_insert" on public.customers
  for insert
  with check (public.is_admin() or salesperson_id = auth.uid());

create policy "customers_update" on public.customers
  for update
  using (public.is_admin() or salesperson_id = auth.uid())
  with check (public.is_admin() or salesperson_id = auth.uid());

-- no delete policy: deactivate via is_active = false instead

-- RLS: customer_products
alter table public.customer_products enable row level security;

create policy "customer_products_select" on public.customer_products
  for select
  using (public.can_see_customer(customer_id));

create policy "customer_products_insert" on public.customer_products
  for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.customers
      where id = customer_id and salesperson_id = auth.uid()
    )
  );

create policy "customer_products_delete" on public.customer_products
  for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.customers
      where id = customer_id and salesperson_id = auth.uid()
    )
  );

-- RLS: tasks (polymorphic across leads/customers)
alter table public.tasks enable row level security;

create policy "tasks_select" on public.tasks
  for select
  using (
    (lead_id is not null and public.can_see_lead(lead_id))
    or (customer_id is not null and public.can_see_customer(customer_id))
  );

create policy "tasks_insert" on public.tasks
  for insert
  with check (
    (lead_id is not null and public.can_see_lead(lead_id))
    or (customer_id is not null and public.can_see_customer(customer_id))
  );

create policy "tasks_update" on public.tasks
  for update
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or created_by = auth.uid()
    or (lead_id is not null and exists (
      select 1 from public.leads where id = lead_id and salesperson_id = auth.uid()
    ))
    or (customer_id is not null and exists (
      select 1 from public.customers where id = customer_id and salesperson_id = auth.uid()
    ))
  )
  with check (
    (lead_id is not null and public.can_see_lead(lead_id))
    or (customer_id is not null and public.can_see_customer(customer_id))
  );

-- RLS: activity (polymorphic, immutable — no update/delete)
alter table public.activity enable row level security;

create policy "activity_select" on public.activity
  for select
  using (
    (lead_id is not null and public.can_see_lead(lead_id))
    or (customer_id is not null and public.can_see_customer(customer_id))
  );

create policy "activity_insert" on public.activity
  for insert
  with check (
    (lead_id is not null and public.can_see_lead(lead_id))
    or (customer_id is not null and public.can_see_customer(customer_id))
  );

create or replace view public.dashboard_overdue_checkins
with (security_invoker = true) as
select c.*, p.full_name as salesperson_name
from public.customers c
left join public.profiles p on p.id = c.salesperson_id
where c.is_active = true
  and c.next_checkin_date < current_date;
