-- Dépenses communes Mane & Myriem
-- À exécuter dans Supabase > SQL Editor

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  amount numeric(10,2) not null,
  description text not null,
  category text not null,
  paid_by text not null,         -- 'mane' | 'myriem'
  split_type text not null default 'proportional', -- 'proportional' | 'equal' | 'full'
  labels text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  mane_income numeric(10,2) not null default 0,
  myriem_income numeric(10,2) not null default 0,
  created_at timestamptz default now(),
  unique(year, month)
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  amount numeric(10,2) not null,
  from_person text not null,
  to_person text not null,
  settled_at timestamptz default now(),
  unique(year, month)
);

-- RLS avec accès public (pas d'auth)
alter table expenses enable row level security;
alter table incomes enable row level security;
alter table settlements enable row level security;

create policy "Public access expenses" on expenses for all using (true) with check (true);
create policy "Public access incomes" on incomes for all using (true) with check (true);
create policy "Public access settlements" on settlements for all using (true) with check (true);

-- Migration si la table existe déjà : ajouter la colonne split_type
-- alter table expenses add column if not exists split_type text not null default 'proportional';
