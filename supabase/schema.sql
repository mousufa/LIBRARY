-- Library Access Portal v2 shared database schema.
-- Run this in Supabase SQL Editor before importing records.

create table if not exists public.library_records (
  id text primary key,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('teacher', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.library_records enable row level security;
alter table public.library_profiles enable row level security;

drop policy if exists "public can read library records" on public.library_records;
create policy "public can read library records"
on public.library_records
for select
using (true);

drop policy if exists "teachers can insert library records" on public.library_records;
create policy "teachers can insert library records"
on public.library_records
for insert
to authenticated
with check (
  exists (
    select 1
    from public.library_profiles p
    where p.user_id = auth.uid()
      and p.role in ('teacher', 'admin')
  )
);

drop policy if exists "teachers can update library records" on public.library_records;
create policy "teachers can update library records"
on public.library_records
for update
to authenticated
using (
  exists (
    select 1
    from public.library_profiles p
    where p.user_id = auth.uid()
      and p.role in ('teacher', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.library_profiles p
    where p.user_id = auth.uid()
      and p.role in ('teacher', 'admin')
  )
);

drop policy if exists "users can read own library profile" on public.library_profiles;
create policy "users can read own library profile"
on public.library_profiles
for select
to authenticated
using (user_id = auth.uid());

create index if not exists library_records_record_category_idx
on public.library_records ((record ->> 'category'));

create index if not exists library_records_record_accession_idx
on public.library_records ((record ->> 'accession'));

create index if not exists library_records_record_shelf_idx
on public.library_records ((record ->> 'shelf'));

-- After creating a teacher user in Supabase Authentication, add that user here:
-- insert into public.library_profiles (user_id, email, role)
-- values ('PASTE-AUTH-USER-ID-HERE', 'teacher@example.com', 'teacher');
