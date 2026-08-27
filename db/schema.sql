create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('employee', 'manager', 'accounting');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.leave_type as enum ('annual', 'wfh', 'sick');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.leave_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role public.user_role not null default 'employee',
  department text not null default 'general',
  annual_leave_allowance integer not null default 20,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.two_factor_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  leave_type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  total_days integer not null check (total_days > 0),
  reason text not null,
  status public.leave_status not null default 'pending',
  assigned_manager_id uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint leave_dates_valid check (end_date >= start_date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);
create index if not exists leave_requests_user_id_idx on public.leave_requests (user_id);
create index if not exists leave_requests_status_idx on public.leave_requests (status);
create index if not exists leave_requests_dates_idx on public.leave_requests (start_date, end_date);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);
create index if not exists password_reset_tokens_hash_idx on public.password_reset_tokens (token_hash);
create index if not exists two_factor_challenges_user_id_idx on public.two_factor_challenges (user_id);
create index if not exists two_factor_challenges_token_hash_idx on public.two_factor_challenges (token_hash);
create index if not exists two_factor_challenges_expires_at_idx on public.two_factor_challenges (expires_at);

alter table public.leave_requests
  add column if not exists assigned_manager_id uuid references public.profiles (id) on delete set null;

alter table public.profiles alter column department set default 'general';

update public.profiles
  set department = 'general'
  where lower(trim(department)) in ('general', 'operations', 'general / operations');

update public.profiles
  set department = 'people'
  where lower(trim(department)) in ('people', 'hr', 'people / hr');

update public.profiles
  set role = 'manager'
  where id = (
    select id from public.profiles
    order by created_at asc
    limit 1
  )
  and not exists (
    select 1 from public.profiles where role = 'manager'
  );
