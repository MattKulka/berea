import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "./_lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 5 });

type Verse = {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

async function getVerse(book: string, chapter: number, verse: number): Promise<Verse | null> {
  const { data } = await supabase
    .from("verses")
    .select("id, book, chapter, verse, text")
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .eq("translation", "BSB")
    .single();
  return data;
}

async function getCrossRefVerses(verseId: number, limit = 8): Promise<Verse[]> {
  const { data: refs } = await supabase
    .from("cross_references")
    .select("to_verse_start_id")
    .eq("from_verse_id", verseId)
    .order("votes", { ascending: false })
    .limit(limit);
  if (!refs || refs.length === 0) return [];
  const { data: verses } = await supabase
    .from("verses")
    .select("id, book, chapter, verse, text")
    .in(
      "id",
      refs.map((r) => r.to_verse_start_id),
    );
  return verses ?? [];
}

async function getSemanticVerses(verseId: number, limit = 8): Promise<Verse[]> {
  const { data: verse } = await supabase.from("verses").select("embedding").eq("id", verseId).single();
  if (!verse?.embedding) return [];
  const { data } = await supabase.rpc("match_verses", {
    query_embedding: verse.embedding,
    match_count: limit,
    exclude_id: verseId,
  });
  return data ?? [];
}

function ref(v: Verse) {
  return `${v.book} ${v.chapter}:${v.verse}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { book, chapter, verse, question } = req.body ?? {};
  if (!book || !chapter || !verse) {
    res.status(400).json({ error: "book, chapter, and verse are required" });
    return;
  }

  try {
    const target = await getVerse(book, Number(chapter), Number(verse));
    if (!target) {
      res.status(404).json({ error: "Verse not found" });
      return;
    }

    const [crossRefs, semantic] = await Promise.all([getCrossRefVerses(target.id), getSemanticVerses(target.id)]);

    const seen = new Set([target.id]);
    const context = [...crossRefs, ...semantic].filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    const contextBlock = context.map((v) => `${ref(v)} — ${v.text}`).join("\n");
    const userQuestion = question?.trim() || "What does this verse mean, and how do the related verses shed light on it?";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      system:
        "You are a careful, humble Bible study assistant. Answer using ONLY the passage and related verses provided below — never your own outside knowledge or theological tradition. " +
        "Cite every claim inline with its reference in parentheses, e.g. (John 3:16). " +
        "If the provided verses don't give enough to answer well, say so plainly instead of speculating. Keep the tone warm but concise. " +
        "Write in plain prose paragraphs only — no markdown formatting, no headers, no bullet lists, no bold/italic asterisks.",
      messages: [
        {
          role: "user",
          content:
            `Passage: ${ref(target)} — ${target.text}\n\n` +
            `Related verses:\n${contextBlock}\n\n` +
            `Question: ${userQuestion}`,
        },
      ],
    });

    const answer = message.content.find((block) => block.type === "text")?.text ?? "";
    res.status(200).json({ answer, contextVerses: context.map(ref) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating the answer." });
  }
}
