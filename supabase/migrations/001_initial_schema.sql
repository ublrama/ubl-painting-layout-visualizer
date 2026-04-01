-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Rack types
create table if not exists rack_types (
  id          int primary key,
  height      float not null,
  width       float not null,
  max_depth   float not null
);

-- Racks
create table if not exists racks (
  name         text primary key,
  rack_type_id int not null references rack_types(id)
);

-- Paintings master list
create table if not exists paintings (
  id                 uuid primary key default gen_random_uuid(),
  signatuur          text not null,
  collection         text not null,
  width              float not null,
  height             float not null,
  depth              float not null default 0,
  assigned_rack_name text references racks(name) on delete set null,
  manually_placed    boolean not null default false,
  predefined_rack    text,
  created_at         timestamptz not null default now()
);

-- Placed paintings (the frozen assignment with x,y coordinates)
create table if not exists placed_paintings (
  id         uuid primary key references paintings(id) on delete cascade,
  rack_name  text not null references racks(name) on delete cascade,
  x          float not null,
  y          float not null
);

-- Assignment state (single row tracking confirmedAt)
create table if not exists assignment_state (
  id           int primary key default 1,
  confirmed_at timestamptz
);

-- Insert default assignment state row
insert into assignment_state (id, confirmed_at) values (1, null)
  on conflict (id) do nothing;
