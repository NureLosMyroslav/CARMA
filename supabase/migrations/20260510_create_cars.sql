create table if not exists cars (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  make         text not null,
  model        text not null,
  year         int  not null check (year between 1900 and 2030),
  mileage      int  not null check (mileage between 0 and 9999999),
  fuel_type    text not null,
  transmission text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists cars_user_id_idx on cars (user_id);
create index if not exists cars_created_at_idx on cars (created_at desc);

alter table cars enable row level security;

drop policy if exists "Users select own cars" on cars;
drop policy if exists "Users insert own cars" on cars;
drop policy if exists "Users update own cars" on cars;
drop policy if exists "Users delete own cars" on cars;

create policy "Users select own cars" on cars
  for select using (auth.uid() = user_id);

create policy "Users insert own cars" on cars
  for insert with check (auth.uid() = user_id);

create policy "Users update own cars" on cars
  for update using (auth.uid() = user_id)
              with check (auth.uid() = user_id);

create policy "Users delete own cars" on cars
  for delete using (auth.uid() = user_id);

create or replace function cars_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cars_updated_at on cars;
create trigger cars_updated_at
  before update on cars
  for each row execute function cars_set_updated_at();
