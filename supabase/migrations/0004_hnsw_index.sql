-- Swap ivfflat for hnsw: faster and more reliable approximate nearest-neighbor
-- search at this scale, without ivfflat's need to be trained/retrained on
-- representative data.
drop index if exists verses_embedding_idx;
create index verses_embedding_idx on verses using hnsw (embedding vector_cosine_ops);
