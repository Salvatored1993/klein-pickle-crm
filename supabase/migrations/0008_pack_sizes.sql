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

alter table public.leads drop column pack_size_format;
alter table public.leads add column pack_sizes pack_size[] not null default '{}';
