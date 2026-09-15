-- Replace the free-text "pack size / format" field with a fixed, multi-select
-- list of the sizes Klein Pickle actually offers. Only a couple of test
-- leads exist so far, so this drops the old free-text values rather than
-- trying to map them onto the new list.

create type pack_size as enum (
  '16 oz',
  '32 oz',
  '1 Gallon',
  '2 Gallon',
  '5 Gallon',
  'Barrel',
  'Tote'
);

-- cascade: dashboard_overdue_followups/dashboard_samples_outstanding/
-- dashboard_quotes_outstanding all select l.* from leads, so they get
-- dropped along with the column and recreated below.
alter table public.leads drop column pack_size_format cascade;
alter table public.leads add column pack_sizes pack_size[] not null default '{}';

create or replace view public.dashboard_overdue_followups
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads l
left join public.profiles p on p.id = l.salesperson_id
where l.next_follow_up_date < current_date
  and l.sales_stage not in ('Won', 'Lost');

create or replace view public.dashboard_samples_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads l
left join public.profiles p on p.id = l.salesperson_id
where l.sample_required = true
  and l.sample_trial_status not in ('Approved', 'Trial Passed');

create or replace view public.dashboard_quotes_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads l
left join public.profiles p on p.id = l.salesperson_id
where l.sales_stage = 'Quote Submitted';
