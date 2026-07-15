import { supabase } from "./supabase";
import type { Verse } from "./types";

export type MemoryCard = {
  id: number;
  verse: Verse;
};

type CardRow = { id: number; verse_id: number };

async function resolveCards(rows: CardRow[]): Promise<MemoryCard[]> {
  if (rows.length === 0) return [];
  const { data: verses, error } = await supabase
    .from("verses")
    .select("id, book, chapter, verse, translation, text")
    .in(
      "id",
      rows.map((r) => r.verse_id),
    );
  if (error) throw error;
  const byId = new Map(verses.map((v) => [v.id, v]));
  return rows.map((r) => ({ id: r.id, verse: byId.get(r.verse_id)! }));
}

export async function decksContainingVerse(verseId: number): Promise<Set<number>> {
  // RLS already restricts memory_cards to the current user's rows.
  const { data, error } = await supabase.from("memory_cards").select("deck_id").eq("verse_id", verseId);
  if (error) throw error;
  return new Set(data.map((r) => r.deck_id));
}

export async function addCardToDeck(userId: string, deckId: number, verseId: number): Promise<void> {
  const { error } = await supabase.from("memory_cards").insert({ user_id: userId, deck_id: deckId, verse_id: verseId });
  if (error) throw error;
}

export async function removeCardFromDeck(deckId: number, verseId: number): Promise<void> {
  const { error } = await supabase.from("memory_cards").delete().eq("deck_id", deckId).eq("verse_id", verseId);
  if (error) throw error;
}

export async function removeCard(cardId: number): Promise<void> {
  const { error } = await supabase.from("memory_cards").delete().eq("id", cardId);
  if (error) throw error;
}

export async function listCardsInDeck(deckId: number): Promise<MemoryCard[]> {
  const { data, error } = await supabase
    .from("memory_cards")
    .select("id, verse_id")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return resolveCards(data);
}
