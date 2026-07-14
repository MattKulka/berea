import { supabase } from "./supabase";
import type { CrossReference, SemanticMatch, Verse } from "./types";

const TRANSLATION = "BSB";

export async function getChapter(book: string, chapter: number): Promise<Verse[]> {
  const { data, error } = await supabase
    .from("verses")
    .select("id, book, chapter, verse, translation, text")
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("translation", TRANSLATION)
    .order("verse", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getCrossReferences(verseId: number): Promise<CrossReference[]> {
  const { data: refs, error } = await supabase
    .from("cross_references")
    .select("id, votes, to_verse_start_id, to_verse_end_id")
    .eq("from_verse_id", verseId)
    .order("votes", { ascending: false })
    .limit(20);
  if (error) throw error;
  if (refs.length === 0) return [];

  const verseIds = Array.from(new Set(refs.flatMap((r) => [r.to_verse_start_id, r.to_verse_end_id])));
  const { data: verses, error: versesError } = await supabase
    .from("verses")
    .select("id, book, chapter, verse, translation, text")
    .in("id", verseIds);
  if (versesError) throw versesError;

  const byId = new Map(verses.map((v) => [v.id, v]));
  return refs.map((r) => ({
    id: r.id,
    votes: r.votes,
    toStart: byId.get(r.to_verse_start_id)!,
    toEnd: byId.get(r.to_verse_end_id)!,
  }));
}

export async function getSemanticMatches(verseId: number, matchCount = 8): Promise<SemanticMatch[]> {
  const { data: verse, error: verseError } = await supabase
    .from("verses")
    .select("embedding")
    .eq("id", verseId)
    .single();
  if (verseError) throw verseError;
  if (!verse.embedding) return [];

  const { data, error } = await supabase.rpc("match_verses", {
    query_embedding: verse.embedding,
    match_count: matchCount,
    exclude_id: verseId,
  });
  if (error) throw error;
  return data;
}
