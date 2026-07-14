import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { listNoteVerseIdsInChapter } from "../lib/notes";
import { getChapter } from "../lib/queries";
import type { Verse } from "../lib/types";

type Props = {
  book: string;
  chapter: number;
  selectedVerse: number | null;
  onSelectVerse: (verse: number) => void;
};

export function ChapterReader({ book, chapter, selectedVerse, onSelectVerse }: Props) {
  const { user } = useAuth();
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [notedIds, setNotedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setVerses(null);
    getChapter(book, chapter).then((data) => {
      if (cancelled) return;
      setVerses(data);
      if (user) {
        listNoteVerseIdsInChapter(data.map((v) => v.id)).then((ids) => {
          if (!cancelled) setNotedIds(ids);
        });
      } else {
        setNotedIds(new Set());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, user]);

  return (
    <article className="chapter-reader">
      <h1 className="chapter-heading">
        {book} {chapter}
      </h1>
      {!verses && <p className="loading">Loading…</p>}
      <motion.p
        key={`${book}-${chapter}`}
        className="chapter-body"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {verses?.map((v) =>
          v.text ? (
            <span
              key={v.id}
              className={"verse" + (selectedVerse === v.verse ? " verse-selected" : "")}
              onClick={() => onSelectVerse(v.verse)}
            >
              <sup className="verse-num">{v.verse}</sup>
              {v.text}
              {notedIds.has(v.id) && <span className="note-dot" title="You have a note here" />}{" "}
            </span>
          ) : null,
        )}
      </motion.p>
    </article>
  );
}
