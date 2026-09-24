delete from public.leads
where trim(company_name) ilike 'franks deli'
returning id, company_name;
