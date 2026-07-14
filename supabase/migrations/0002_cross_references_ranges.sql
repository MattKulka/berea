-- Store cross-references as verse ranges (start/end) instead of expanding every
-- ranged reference (e.g. "Prov 8:22-30") into one row per verse. Keeps the table
-- at ~345k rows (one per OpenBible.info entry) instead of ballooning into the millions.
drop table if exists cross_references;

create table cross_references (
  id bigint generated always as identity primary key,
  from_verse_id bigint not null references verses(id) on delete cascade,
  to_verse_start_id bigint not null references verses(id) on delete cascade,
  to_verse_end_id bigint not null references verses(id) on delete cascade,
  votes int not null default 0,
  unique (from_verse_id, to_verse_start_id, to_verse_end_id)
);

alter table cross_references enable row level security;

create policy "cross references are public read"
  on cross_references for select using (true);
