import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("SET statement_timeout = 0");

console.log("Dropping old index if present...");
await client.query("DROP INDEX IF EXISTS verses_embedding_idx");

console.log("Building HNSW index over verses.embedding (this may take a minute)...");
console.time("hnsw build");
await client.query("CREATE INDEX verses_embedding_idx ON verses USING hnsw (embedding vector_cosine_ops)");
console.timeEnd("hnsw build");

await client.end();
console.log("Done.");
