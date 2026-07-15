import { supabase } from "./supabase";

export type Deck = {
  id: number;
  name: string;
  cardCount: number;
};

export async function listDecks(): Promise<Deck[]> {
  const { data, error } = await supabase
    .from("decks")
    .select("id, name, memory_cards(count)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    cardCount: (d.memory_cards as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function createDeck(userId: string, name: string): Promise<Deck> {
  const { data, error } = await supabase.from("decks").insert({ user_id: userId, name }).select("id, name").single();
  if (error) throw error;
  return { id: data.id, name: data.name, cardCount: 0 };
}

export async function deleteDeck(deckId: number): Promise<void> {
  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  if (error) throw error;
}

export async function getDeck(deckId: number): Promise<Deck | null> {
  const { data, error } = await supabase.from("decks").select("id, name").eq("id", deckId).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, name: data.name, cardCount: 0 } : null;
}
