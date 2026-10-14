-- Two more "Customer type" options for leads and customers. Existing
-- options and selections are unchanged.
alter type public.customer_type add value if not exists 'End User' before 'Other';
alter type public.customer_type add value if not exists 'Manufacturer' before 'Other';
