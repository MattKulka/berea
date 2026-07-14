import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import { AuthMenu } from "./components/AuthMenu";
import { BookChapterNav } from "./components/BookChapterNav";
import { ChapterReader } from "./components/ChapterReader";
import { CrossReferencePanel } from "./components/CrossReferencePanel";
import { getChapter } from "./lib/queries";
import type { Verse } from "./lib/types";

function ReaderPage() {
  const { book = "John", chapter = "1" } = useParams();
  const chapterNum = Number(chapter);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  const verseParam = searchParams.get("v");

  useEffect(() => {
    setSelectedVerse(null);
    if (!verseParam) return;
    let cancelled = false;
    getChapter(book, chapterNum).then((verses) => {
      if (cancelled) return;
      const found = verses.find((v) => v.verse === Number(verseParam));
      if (found) setSelectedVerse(found);
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapterNum, verseParam]);

  function goTo(nextBook: string, nextChapter: number, verse?: number) {
    const path = `/read/${encodeURIComponent(nextBook)}/${nextChapter}`;
    navigate(verse ? `${path}?v=${verse}` : path);
  }

  function selectVerse(verse: number) {
    setSearchParams({ v: String(verse) });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/read/John/1" className="brand">
          Berea
        </Link>
        <BookChapterNav book={book} chapter={chapterNum} onNavigate={(b, c) => goTo(b, c)} />
        <AuthMenu />
      </header>
      <main className="app-main">
        <ChapterReader book={book} chapter={chapterNum} selectedVerse={selectedVerse?.verse ?? null} onSelectVerse={selectVerse} />
        {selectedVerse && <CrossReferencePanel verse={selectedVerse} onNavigate={(b, c, v) => goTo(b, c, v)} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/read/John/1" replace />} />
      <Route path="/read/:book/:chapter" element={<ReaderPage />} />
    </Routes>
  );
}
