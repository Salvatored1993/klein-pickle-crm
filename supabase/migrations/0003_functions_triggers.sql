create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
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
    or exists (
      select 1 from public.leads
      where id = target_lead_id and salesperson_id = auth.uid()
    )
    or exists (
      select 1 from public.tasks
      where lead_id = target_lead_id and assigned_to = auth.uid()
    )
    or exists (
      select 1 from public.lead_activity
      where lead_id = target_lead_id and author_id = auth.uid()
    );
$$;

create or replace function public.admin_set_role(target_user_id uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can change roles';
  end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

create or replace function public.admin_set_active(target_user_id uuid, new_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can change account status';
  end if;
  update public.profiles set is_active = new_is_active where id = target_user_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create or replace function public.log_lead_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_activity (lead_id, author_id, activity_type, metadata)
    values (new.id, new.salesperson_id, 'lead_created', jsonb_build_object('company_name', new.company_name));
  elsif tg_op = 'UPDATE' and new.sales_stage is distinct from old.sales_stage then
    insert into public.lead_activity (lead_id, author_id, activity_type, metadata)
    values (new.id, auth.uid(), 'stage_change', jsonb_build_object('from_stage', old.sales_stage, 'to_stage', new.sales_stage));
  end if;
  return new;
end;
$$;

create trigger leads_log_activity
  after insert or update on public.leads
  for each row execute function public.log_lead_activity();
