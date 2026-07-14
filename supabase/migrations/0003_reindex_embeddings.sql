-- The ivfflat index in 0001 was built while `verses` was still empty, so its
-- cluster centroids are degenerate. Rebuild now that all ~31k embeddings exist,
-- and refresh planner stats so match_verses can actually use the index.
reindex index verses_embedding_idx;
analyze verses;
