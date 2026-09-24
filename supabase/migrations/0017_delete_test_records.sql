-- Deletes named test leads (including the one that was converted into the
-- test customer below) and the test customer itself. Uses RETURNING so the
-- result grid shows exactly what was removed — check it matches before
-- trusting the run.

delete from public.leads
where company_name in ('test 3', 'test 2', 'j', 'Franks Deli', 'test')
returning id, company_name;

delete from public.customers
where company_name = 'test'
returning id, company_name;
