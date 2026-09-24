-- Links a CRM customer record to its ERP sales history, so a
-- salesperson can see real order history/what-they-buy on the same
-- page where they manage the relationship (tasks, notes, check-ins).
alter table public.customers
  add column sales_customer_code text
    references public.sales_customers (customer_code),
  add constraint customers_sales_customer_code_unique unique (sales_customer_code);
