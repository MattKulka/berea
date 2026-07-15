import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "http://localhost:5174";
const OUT_DIR = path.join(__dirname, "../docs/screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const DEMO_EMAIL = process.env.DEMO_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
if (!DEMO_EMAIL || !DEMO_PASSWORD) throw new Error("Set DEMO_EMAIL and DEMO_PASSWORD env vars (see scripts/create-demo-user.mjs)");

async function shot(page, name, opts = {}) {
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true, ...opts });
  console.log("captured", name);
}

// Clip from the top of `fromSelector` through the bottom of `toSelector` (same x-range as fromSelector).
// Resizes the viewport tall enough that nothing needs to scroll, so both elements' bounding
// boxes are measured in the same (unscrolled) coordinate space.
async function clippedShot(page, fromSelector, toSelector, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const original = page.viewportSize();
  const rough = await page.locator(toSelector).boundingBox();
  await page.setViewportSize({ width: original.width, height: Math.ceil(rough.y + rough.height + 400) });
  await page.waitForTimeout(600);
  const from = await page.locator(fromSelector).boundingBox();
  const to = await page.locator(toSelector).boundingBox();
  await page.screenshot({
    path: path.join(OUT_DIR, name),
    clip: { x: from.x, y: from.y, width: from.width, height: to.y + to.height - from.y + 150 },
  });
  await page.setViewportSize(original);
  console.log("captured", name);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (msg) => console.log("[browser]", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("requestfailed", (req) => console.log("[requestfailed]", req.url(), req.failure()?.errorText));

// 1. Reading + cross-reference explorer (light mode)
await page.goto(`${BASE}/read/John/1?v=1`, { waitUntil: "networkidle" });
await page.waitForSelector(".radial-graph");
await page.waitForTimeout(1200);
await shot(page, "01-reading-cross-references.png", { fullPage: false });

// 2. Expanded radial graph modal
await page.click(".radial-expand-btn");
await page.waitForTimeout(900);
await shot(page, "02-radial-graph-expanded.png", { fullPage: false });
await page.click(".radial-modal-close");
await page.waitForSelector(".radial-modal-backdrop", { state: "detached" });

// 3. Study Q&A with a real grounded answer
await page.fill(".qa-form textarea", "What does it mean that the Word was God?");
await page.click(".qa-form button[type=submit]");
await page.waitForSelector(".qa-answer", { timeout: 30000 });
await page.waitForTimeout(400);
await clippedShot(page, ".cross-ref-panel", ".qa-answer", "03-study-qa.png");

// 4. Dark mode
await page.click(".theme-toggle");
await page.waitForTimeout(400);
await shot(page, "04-dark-mode.png", { fullPage: false });
await page.click(".theme-toggle");
await page.waitForTimeout(400);

// 5. Sign in as a pre-created demo account (see scripts/create-demo-user.mjs — avoids
// touching Supabase's email system at all, sign-in never sends mail).
await page.click(".auth-link-btn:has-text('Sign in')");
await page.fill(".auth-form input[type=email]", DEMO_EMAIL);
await page.fill(".auth-form input[type=password]", DEMO_PASSWORD);
await page.click(".auth-form button[type=submit]");
await page.waitForSelector(".auth-email", { timeout: 15000 });
console.log("Signed in as demo user:", DEMO_EMAIL);

// 6. Add a note with tags
await page.click(".ref-section:has-text('Notes') >> text=+ Add a note");
await page.fill(".note-editor textarea", "The eternal preexistence of Christ, echoing Genesis 1:1 — He is both distinct from the Father and fully God.");
await page.fill(".note-editor input", "christology, key-verse");
await page.click(".note-editor-actions >> text=Add note");
await page.waitForTimeout(500);
await clippedShot(page, ".cross-ref-panel", ".ref-section:has-text('Notes')", "05-notes.png");

// 7. Add to a memorization deck
await page.click(".memorize-btn");
await page.waitForSelector(".deck-modal-content");
await page.fill(".deck-create-form input", "Key Verses");
await page.click(".deck-create-form button:has-text('Create')");
await page.waitForTimeout(500);
await shot(page, "06-add-to-deck-modal.png", { fullPage: false });
await page.click(".radial-modal-close");
await page.waitForSelector(".radial-modal-backdrop", { state: "detached" });

// add a couple more verses to the same deck for a fuller deck screenshot
for (const [book, chapter, verse] of [["John", 3, 16], ["Romans", 8, 28]]) {
  await page.goto(`${BASE}/read/${book}/${chapter}?v=${verse}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".memorize-btn");
  await page.click(".memorize-btn");
  await page.waitForSelector(".deck-modal-content");
  await page.click(".deck-checkbox-row:has-text('Key Verses') input");
  await page.waitForTimeout(400);
  await page.click(".radial-modal-close");
  await page.waitForSelector(".radial-modal-backdrop", { state: "detached" });
}

// 8. Memorize deck list
await page.goto(`${BASE}/memorize`, { waitUntil: "networkidle" });
await page.waitForSelector(".deck-card");
await page.waitForTimeout(400);
await shot(page, "07-memorize-decks.png");

// 9. Flashcard study view
await page.click(".deck-card-body");
await page.waitForSelector(".flashcard");
await page.click(".flashcard button:has-text('Reveal')");
await page.waitForTimeout(400);
await shot(page, "08-flashcard.png");

console.log("DEMO_EMAIL=" + DEMO_EMAIL);
await browser.close();
