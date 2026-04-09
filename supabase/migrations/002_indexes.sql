-- ---------------------------------------------------------------------------
-- Performance indexes
-- Run this migration against your Supabase project once.
-- ---------------------------------------------------------------------------

-- paintings: ordering by signatuur (the default sort in every listing query)
create index if not exists idx_paintings_signatuur
    on paintings (signatuur asc);

-- paintings: filtering unassigned rows  (WHERE assigned_rack_name IS NULL)
create index if not exists idx_paintings_assigned_rack_name
    on paintings (assigned_rack_name);

-- placed_paintings: filtering / grouping by rack
create index if not exists idx_placed_paintings_rack_name
    on placed_paintings (rack_name);

-- racks: looking up racks by their type
create index if not exists idx_racks_rack_type_id
    on racks (rack_type_id);

