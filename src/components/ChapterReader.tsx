import { useEffect, useState } from "react";
import { getChapter } from "../lib/queries";
import type { Verse } from "../lib/types";

type Props = {
  book: string;
  chapter: number;
  selectedVerse: number | null;
  onSelectVerse: (verse: number) => void;
};

export function ChapterReader({ book, chapter, selectedVerse, onSelectVerse }: Props) {
  const [verses, setVerses] = useState<Verse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVerses(null);
    getChapter(book, chapter).then((data) => {
      if (!cancelled) setVerses(data);
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  return (
    <article className="chapter-reader">
      <h1 className="chapter-heading">
        {book} {chapter}
      </h1>
      {!verses && <p className="loading">Loading…</p>}
      <p className="chapter-body">
        {verses?.map((v) =>
          v.text ? (
            <span
              key={v.id}
              className={"verse" + (selectedVerse === v.verse ? " verse-selected" : "")}
              onClick={() => onSelectVerse(v.verse)}
            >
              <sup className="verse-num">{v.verse}</sup>
              {v.text}{" "}
            </span>
          ) : null,
        )}
      </p>
    </article>
  );
}
