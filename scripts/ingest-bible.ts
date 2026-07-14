import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { supabaseAdmin } from "./lib/supabase-admin.ts";
import { BSB_NAME_TO_CANONICAL, OSIS_ABBR_TO_CANONICAL } from "./lib/bible-books.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATION = "BSB";
const BATCH_SIZE = 500;

type VerseRow = { book: string; chapter: number; verse: number; translation: string; text: string };
type BsbSource = { books: { name: string; chapters: { chapter: number; verses: { verse: number; text: string }[] }[] }[] };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ingestVerses(): Promise<Map<string, number>> {
  const raw = readFileSync(path.join(__dirname, "data/BSB.json"), "utf-8");
  const source: BsbSource = JSON.parse(raw);

  const rows: VerseRow[] = [];
  for (const book of source.books) {
    const canonical = BSB_NAME_TO_CANONICAL[book.name];
    if (!canonical) throw new Error(`Unmapped book name: ${book.name}`);
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        rows.push({
          book: canonical,
          chapter: chapter.chapter,
          verse: verse.verse,
          translation: TRANSLATION,
          text: verse.text.trim(),
        });
      }
    }
  }

  console.log(`Parsed ${rows.length} verses from BSB.json`);

  const idByRef = new Map<string, number>();
  const batches = chunk(rows, BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const { data, error } = await supabaseAdmin
      .from("verses")
      .upsert(batches[i], { onConflict: "book,chapter,verse,translation" })
      .select("id, book, chapter, verse");
    if (error) throw error;
    for (const row of data!) {
      idByRef.set(`${row.book}|${row.chapter}|${row.verse}`, row.id);
    }
    process.stdout.write(`\rUpserted verses batch ${i + 1}/${batches.length}`);
  }
  console.log(`\nDone. ${idByRef.size} verses now have ids.`);
  return idByRef;
}

type ParsedRef = { book: string; chapter: number; verse: number };

function parseRef(ref: string): ParsedRef {
  const match = ref.match(/^(\d?[A-Za-z]+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Unparseable verse ref: ${ref}`);
  const [, abbr, chapter, verse] = match;
  const book = OSIS_ABBR_TO_CANONICAL[abbr];
  if (!book) throw new Error(`Unmapped OSIS abbreviation: ${abbr}`);
  return { book, chapter: Number(chapter), verse: Number(verse) };
}

async function ingestCrossReferences(idByRef: Map<string, number>) {
  const raw = readFileSync(path.join(__dirname, "data/cross_references.txt"), "utf-8");
  const lines = raw.split("\n").slice(1).filter((line) => line.trim().length > 0);

  type CrossRefRow = { from_verse_id: number; to_verse_start_id: number; to_verse_end_id: number; votes: number };
  const rows: CrossRefRow[] = [];
  let skipped = 0;

  for (const line of lines) {
    const [fromRaw, toRaw, votesRaw] = line.split("\t");
    try {
      const from = parseRef(fromRaw);
      const fromId = idByRef.get(`${from.book}|${from.chapter}|${from.verse}`);
      if (!fromId) throw new Error(`No verse id for from-ref ${fromRaw}`);

      const [toStartRaw, toEndRaw] = toRaw.includes("-") ? toRaw.split("-") : [toRaw, toRaw];
      const toStart = parseRef(toStartRaw);
      const toEnd = parseRef(toEndRaw);
      const toStartId = idByRef.get(`${toStart.book}|${toStart.chapter}|${toStart.verse}`);
      const toEndId = idByRef.get(`${toEnd.book}|${toEnd.chapter}|${toEnd.verse}`);
      if (!toStartId || !toEndId) throw new Error(`No verse id for to-ref ${toRaw}`);

      rows.push({
        from_verse_id: fromId,
        to_verse_start_id: toStartId,
        to_verse_end_id: toEndId,
        votes: Number(votesRaw) || 0,
      });
    } catch (err) {
      skipped++;
      if (skipped <= 10) console.warn(`Skipping line "${line}": ${(err as Error).message}`);
    }
  }

  console.log(`Parsed ${rows.length} cross-references (${skipped} skipped)`);

  const batches = chunk(rows, 1000);
  for (let i = 0; i < batches.length; i++) {
    const { error } = await supabaseAdmin
      .from("cross_references")
      .upsert(batches[i], { onConflict: "from_verse_id,to_verse_start_id,to_verse_end_id", ignoreDuplicates: true });
    if (error) throw error;
    process.stdout.write(`\rUpserted cross-reference batch ${i + 1}/${batches.length}`);
  }
  console.log("\nDone.");
}

async function main() {
  const idByRef = await ingestVerses();
  await ingestCrossReferences(idByRef);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
