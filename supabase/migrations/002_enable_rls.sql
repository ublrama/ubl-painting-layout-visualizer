-- Enable Row Level Security on all public tables exposed to PostgREST.
-- The server-side API uses the service_role key, which bypasses RLS.
-- These policies grant full access to signed-in users (authenticated role)
-- and deny all access to the anonymous role, ensuring no data leaks through
-- direct PostgREST calls without a valid session.

-- rack_types
alter table rack_types enable row level security;

create policy "authenticated users can read rack_types"
  on rack_types for select
  to authenticated
  using (true);

create policy "authenticated users can insert rack_types"
  on rack_types for insert
  to authenticated
  with check (true);

create policy "authenticated users can update rack_types"
  on rack_types for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete rack_types"
  on rack_types for delete
  to authenticated
  using (true);

-- racks
alter table racks enable row level security;

create policy "authenticated users can read racks"
  on racks for select
  to authenticated
  using (true);

create policy "authenticated users can insert racks"
  on racks for insert
  to authenticated
  with check (true);

create policy "authenticated users can update racks"
  on racks for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete racks"
  on racks for delete
  to authenticated
  using (true);

-- paintings
alter table paintings enable row level security;

create policy "authenticated users can read paintings"
  on paintings for select
  to authenticated
  using (true);

create policy "authenticated users can insert paintings"
  on paintings for insert
  to authenticated
  with check (true);

create policy "authenticated users can update paintings"
  on paintings for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete paintings"
  on paintings for delete
  to authenticated
  using (true);

-- placed_paintings
alter table placed_paintings enable row level security;

create policy "authenticated users can read placed_paintings"
  on placed_paintings for select
  to authenticated
  using (true);

create policy "authenticated users can insert placed_paintings"
  on placed_paintings for insert
  to authenticated
  with check (true);

create policy "authenticated users can update placed_paintings"
  on placed_paintings for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete placed_paintings"
  on placed_paintings for delete
  to authenticated
  using (true);

-- assignment_state
alter table assignment_state enable row level security;

create policy "authenticated users can read assignment_state"
  on assignment_state for select
  to authenticated
  using (true);

create policy "authenticated users can insert assignment_state"
  on assignment_state for insert
  to authenticated
  with check (true);

create policy "authenticated users can update assignment_state"
  on assignment_state for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete assignment_state"
  on assignment_state for delete
  to authenticated
  using (true);
