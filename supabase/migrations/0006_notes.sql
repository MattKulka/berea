-- User notes attached to a verse or verse range, with free-form tags.
create table notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_start_id bigint not null references verses(id) on delete cascade,
  verse_end_id bigint not null references verses(id) on delete cascade,
  body text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "users manage own notes"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index notes_user_id_idx on notes (user_id);
create index notes_verse_start_id_idx on notes (verse_start_id);
create index notes_tags_idx on notes using gin (tags);
