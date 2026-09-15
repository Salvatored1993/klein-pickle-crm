-- Salespeople can now see every lead and customer (so reps don't
-- double-contact the same company), but editing stays restricted to the
-- owning salesperson or an admin — the leads/customers update & insert
-- policies already enforce that and are unchanged.
--
-- Because can_see_lead()/can_see_customer() are called from inside the
-- existing select policies (and from the tasks/activity policies, which
-- check "can I see the parent record"), broadening these two functions is
-- enough to extend visibility everywhere it should apply. QA/Operations
-- are intentionally left out for now — nobody is in those roles yet.

create or replace function public.is_sales()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'sales'
  );
$$;

create or replace function public.can_see_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.is_sales()
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
    or public.is_sales()
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
