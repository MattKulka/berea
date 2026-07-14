import { BIBLE_STRUCTURE } from "../data/bible-structure";

type Props = {
  book: string;
  chapter: number;
  onNavigate: (book: string, chapter: number) => void;
};

export function BookChapterNav({ book, chapter, onNavigate }: Props) {
  const current = BIBLE_STRUCTURE.find((b) => b.name === book)!;
  const chapterCount = current.chapters.length;

  function handleBookChange(nextBook: string) {
    onNavigate(nextBook, 1);
  }

  function handleChapterChange(nextChapter: number) {
    onNavigate(book, nextChapter);
  }

  function goRelative(delta: number) {
    const idx = BIBLE_STRUCTURE.findIndex((b) => b.name === book);
    let nextChapter = chapter + delta;
    let nextIdx = idx;
    if (nextChapter < 1) {
      nextIdx = idx - 1;
      if (nextIdx < 0) return;
      nextChapter = BIBLE_STRUCTURE[nextIdx].chapters.length;
    } else if (nextChapter > chapterCount) {
      nextIdx = idx + 1;
      if (nextIdx >= BIBLE_STRUCTURE.length) return;
      nextChapter = 1;
    }
    onNavigate(BIBLE_STRUCTURE[nextIdx].name, nextChapter);
  }

  return (
    <nav className="book-chapter-nav">
      <button className="nav-arrow" onClick={() => goRelative(-1)} aria-label="Previous chapter">
        ‹
      </button>
      <select value={book} onChange={(e) => handleBookChange(e.target.value)} aria-label="Book">
        <optgroup label="Old Testament">
          {BIBLE_STRUCTURE.filter((b) => b.testament === "OT").map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="New Testament">
          {BIBLE_STRUCTURE.filter((b) => b.testament === "NT").map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </optgroup>
      </select>
      <select value={chapter} onChange={(e) => handleChapterChange(Number(e.target.value))} aria-label="Chapter">
        {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button className="nav-arrow" onClick={() => goRelative(1)} aria-label="Next chapter">
        ›
      </button>
    </nav>
  );
}
