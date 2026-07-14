-- Berea schema: verses, canonical cross-references, and SM-2 memorization progress.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists vector;

create table if not exists verses (
  id bigint generated always as identity primary key,
  book text not null,
  chapter int not null,
  verse int not null,
  translation text not null default 'WEB',
  text text not null,
  embedding vector(1024),
  unique (book, chapter, verse, translation)
);

create index if not exists verses_embedding_idx
  on verses using ivfflat (embedding vector_cosine_ops) with (lists = 200);

create table if not exists cross_references (
  id bigint generated always as identity primary key,
  from_verse_id bigint not null references verses(id) on delete cascade,
  to_verse_id bigint not null references verses(id) on delete cascade,
  votes int not null default 0,
  unique (from_verse_id, to_verse_id)
);

-- SM-2 spaced repetition state, one row per user per memorized verse.
create table if not exists memory_cards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_id bigint not null references verses(id) on delete cascade,
  ease_factor real not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, verse_id)
);

alter table verses enable row level security;
alter table cross_references enable row level security;
alter table memory_cards enable row level security;

create policy "verses are public read"
  on verses for select using (true);

create policy "cross references are public read"
  on cross_references for select using (true);

create policy "users manage own memory cards"
  on memory_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Vector similarity search over verses, callable from the client as an RPC.
create or replace function match_verses(
  query_embedding vector(1024),
  match_count int default 10,
  exclude_id bigint default null
)
returns table (
  id bigint,
  book text,
  chapter int,
  verse int,
  text text,
  similarity float
)
language sql stable
as $$
  select id, book, chapter, verse, text,
         1 - (embedding <=> query_embedding) as similarity
  from verses
  where embedding is not null
    and (exclude_id is null or id <> exclude_id)
  order by embedding <=> query_embedding
  limit match_count;
$$;
