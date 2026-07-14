import { supabaseAdmin } from "./lib/supabase-admin.ts";

const VOYAGE_MODEL = "voyage-3";
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const EMBED_BATCH_SIZE = 96;
const FETCH_PAGE_SIZE = 1000;

if (!VOYAGE_API_KEY) throw new Error("Missing VOYAGE_API_KEY in .env.local");

type VerseRow = {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  text: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchVersesMissingEmbeddings(): Promise<VerseRow[]> {
  const all: VerseRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from("verses")
      .select("id, book, chapter, verse, translation, text")
      .is("embedding", null)
      .neq("text", "")
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as VerseRow[]));
    if (data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return all;
}

async function embedBatch(texts: string[], attempt = 1): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: texts, model: VOYAGE_MODEL, input_type: "document" }),
  });

  if (res.status === 429 && attempt <= 5) {
    const wait = attempt * 2000;
    console.warn(`\nRate limited, retrying in ${wait}ms (attempt ${attempt})`);
    await new Promise((r) => setTimeout(r, wait));
    return embedBatch(texts, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Voyage API error ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function main() {
  const verses = await fetchVersesMissingEmbeddings();
  console.log(`${verses.length} verses need embeddings`);
  if (verses.length === 0) return;

  const batches = chunk(verses, EMBED_BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const embeddings = await embedBatch(batch.map((v) => v.text));

    const rows = batch.map(({ id: _id, ...v }, idx) => ({ ...v, embedding: embeddings[idx] }));
    const { error } = await supabaseAdmin
      .from("verses")
      .upsert(rows, { onConflict: "book,chapter,verse,translation" });
    if (error) throw error;

    process.stdout.write(`\rEmbedded batch ${i + 1}/${batches.length} (${(i + 1) * EMBED_BATCH_SIZE} / ${verses.length} verses)`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
