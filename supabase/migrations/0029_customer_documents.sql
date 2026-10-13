-- Documents (signed agreements, forms, spec sheets…) attached to a
-- customer, mirroring lead_documents (0028): private to the customer's
-- salesperson and admin. Files live in a private Storage bucket under
-- "<customer_id>/<random>-<file name>".

-- security definer: reads customers without being limited by caller RLS
create or replace function public.can_edit_customer(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.customers
    where id = target_customer_id and salesperson_id = auth.uid()
  );
$$;

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index customer_documents_customer_id_idx on public.customer_documents (customer_id);

alter table public.customer_documents enable row level security;

create policy "customer_documents_select" on public.customer_documents
  for select to authenticated
  using (public.can_edit_customer(customer_id));

create policy "customer_documents_insert" on public.customer_documents
  for insert to authenticated
  with check (public.can_edit_customer(customer_id) and uploaded_by = auth.uid());

create policy "customer_documents_delete" on public.customer_documents
  for delete to authenticated
  using (public.can_edit_customer(customer_id));

-- Private bucket, 25 MB per file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('customer-documents', 'customer-documents', false, 26214400)
on conflict (id) do nothing;

-- The first folder of the object path is the customer id.
create policy "customer_documents_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'customer-documents'
    and public.can_edit_customer(((storage.foldername(name))[1])::uuid)
  );

create policy "customer_documents_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'customer-documents'
    and public.can_edit_customer(((storage.foldername(name))[1])::uuid)
  );

create policy "customer_documents_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'customer-documents'
    and public.can_edit_customer(((storage.foldername(name))[1])::uuid)
  );
