-- Switch from voyage-3 (1024-dim) to voyage-3-lite (512-dim) embeddings.
-- Roughly halves both the raw vector storage and the HNSW index size, which
-- is what pushed the free-tier project over its 500MB database cap.
-- This clears all existing embeddings; scripts/generate-embeddings.ts must be
-- re-run afterward to repopulate them at the new dimension.

drop index if exists verses_embedding_idx;
drop function if exists match_verses(vector, int, bigint);

alter table verses alter column embedding type vector(512) using null;

create or replace function match_verses(
  query_embedding vector(512),
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
