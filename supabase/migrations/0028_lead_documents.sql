-- Documents (NDAs, spec sheets, signed forms…) attached to a lead. Like
-- the rest of a lead's details, they're private to the owning salesperson
-- and admin. Files live in a private Storage bucket under
-- "<lead_id>/<random>-<file name>"; this table holds the list shown on
-- the lead page.

-- security definer: reads leads without being limited by the caller's RLS
create or replace function public.can_edit_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.leads
    where id = target_lead_id and salesperson_id = auth.uid()
  );
$$;

create table public.lead_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index lead_documents_lead_id_idx on public.lead_documents (lead_id);

alter table public.lead_documents enable row level security;

create policy "lead_documents_select" on public.lead_documents
  for select to authenticated
  using (public.can_edit_lead(lead_id));

create policy "lead_documents_insert" on public.lead_documents
  for insert to authenticated
  with check (public.can_edit_lead(lead_id) and uploaded_by = auth.uid());

create policy "lead_documents_delete" on public.lead_documents
  for delete to authenticated
  using (public.can_edit_lead(lead_id));

-- Private bucket, 25 MB per file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lead-documents', 'lead-documents', false, 26214400)
on conflict (id) do nothing;

-- The first folder of the object path is the lead id.
create policy "lead_documents_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'lead-documents'
    and public.can_edit_lead(((storage.foldername(name))[1])::uuid)
  );

create policy "lead_documents_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lead-documents'
    and public.can_edit_lead(((storage.foldername(name))[1])::uuid)
  );

create policy "lead_documents_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'lead-documents'
    and public.can_edit_lead(((storage.foldername(name))[1])::uuid)
  );
