import { supabase } from "./supabase";
import type { Note, Verse } from "./types";

type NoteRow = {
  id: number;
  user_id: string;
  verse_start_id: number;
  verse_end_id: number;
  body: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

async function resolveVerses(rows: NoteRow[]): Promise<Note[]> {
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.verse_start_id, r.verse_end_id])));
  const { data: verses, error } = await supabase.from("verses").select("id, book, chapter, verse, translation, text").in("id", ids);
  if (error) throw error;
  const byId = new Map<number, Verse>(verses.map((v) => [v.id, v]));
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    verseStart: byId.get(r.verse_start_id)!,
    verseEnd: byId.get(r.verse_end_id)!,
    body: r.body,
    tags: r.tags,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function listNotesForVerse(verseId: number): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("verse_start_id", verseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return resolveVerses(data);
}

export async function createNote(userId: string, verseId: number, body: string, tags: string[]): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: userId, verse_start_id: verseId, verse_end_id: verseId, body, tags })
    .select("*")
    .single();
  if (error) throw error;
  const [note] = await resolveVerses([data]);
  return note;
}

export async function updateNote(id: number, body: string, tags: string[]): Promise<void> {
  const { error } = await supabase.from("notes").update({ body, tags, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: number): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export async function listNoteVerseIdsInChapter(verseIds: number[]): Promise<Set<number>> {
  if (verseIds.length === 0) return new Set();
  const { data, error } = await supabase.from("notes").select("verse_start_id").in("verse_start_id", verseIds);
  if (error) throw error;
  return new Set(data.map((r) => r.verse_start_id));
}

export async function listAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return resolveVerses(data);
}
