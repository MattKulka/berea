import { supabase } from "./supabase";
import { nextReview } from "./sm2";
import type { Verse } from "./types";

export type MemoryCard = {
  id: number;
  verse: Verse;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
};

type CardRow = {
  id: number;
  verse_id: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
};

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
  return rows.map((r) => ({
    id: r.id,
    verse: byId.get(r.verse_id)!,
    easeFactor: r.ease_factor,
    intervalDays: r.interval_days,
    repetitions: r.repetitions,
    dueAt: r.due_at,
  }));
}

export async function isInDeck(userId: string, verseId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from("memory_cards")
    .select("id")
    .eq("user_id", userId)
    .eq("verse_id", verseId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function addToDeck(userId: string, verseId: number): Promise<number> {
  const { data, error } = await supabase
    .from("memory_cards")
    .insert({ user_id: userId, verse_id: verseId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function removeFromDeck(cardId: number): Promise<void> {
  const { error } = await supabase.from("memory_cards").delete().eq("id", cardId);
  if (error) throw error;
}

export async function listDueCards(): Promise<MemoryCard[]> {
  const { data, error } = await supabase
    .from("memory_cards")
    .select("id, verse_id, ease_factor, interval_days, repetitions, due_at")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true });
  if (error) throw error;
  return resolveCards(data);
}

export async function deckStats(): Promise<{ total: number; due: number }> {
  const { count: total } = await supabase.from("memory_cards").select("*", { count: "exact", head: true });
  const { count: due } = await supabase
    .from("memory_cards")
    .select("*", { count: "exact", head: true })
    .lte("due_at", new Date().toISOString());
  return { total: total ?? 0, due: due ?? 0 };
}

export async function reviewCard(card: MemoryCard, quality: number): Promise<void> {
  const result = nextReview(
    { easeFactor: card.easeFactor, intervalDays: card.intervalDays, repetitions: card.repetitions },
    quality,
  );
  const { error } = await supabase
    .from("memory_cards")
    .update({
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      due_at: result.dueAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", card.id);
  if (error) throw error;
}
