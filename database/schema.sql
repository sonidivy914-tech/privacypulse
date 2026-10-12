-- PrivacyPulse Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)

create extension if not exists pgcrypto;

create table public.digital_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_name text not null,
  category text not null default 'other'
    check (category in ('social','finance','shopping','work','entertainment','other')),
  mfa_enabled boolean not null default false,
  recovery_reviewed boolean not null default false,
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.digital_accounts(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'medium'
    check (severity in ('low','medium','high')),
  occurred_at timestamptz,
  status text not null default 'open'
    check (status in ('open','investigating','resolved')),
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);

create index digital_accounts_user_idx on public.digital_accounts(user_id);
create index checklist_user_idx on public.checklist_items(user_id);
create index reminders_user_due_idx on public.reminders(user_id, due_at);
create index incidents_user_created_idx on public.incidents(user_id, created_at desc);

alter table public.digital_accounts enable row level security;
alter table public.checklist_items enable row level security;
alter table public.reminders enable row level security;
alter table public.incidents enable row level security;
alter table public.user_preferences enable row level security;

create policy "Owners manage digital accounts"
on public.digital_accounts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage checklist"
on public.checklist_items for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage reminders"
on public.reminders for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage incidents"
on public.incidents for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage preferences"
on public.user_preferences for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

