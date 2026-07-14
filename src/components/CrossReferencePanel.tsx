import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCrossReferences, getSemanticMatches } from "../lib/queries";
import { MemorizeToggle } from "./MemorizeToggle";
import { NotesSection } from "./NotesSection";
import { RadialGraph } from "./RadialGraph";
import { RadialGraphModal } from "./RadialGraphModal";
import { StudyQA } from "./StudyQA";
import type { CrossReference, SemanticMatch, Verse } from "../lib/types";

type Props = {
  verse: Verse;
  onNavigate: (book: string, chapter: number, verse: number) => void;
};

function refLabel(ref: CrossReference): string {
  const { toStart, toEnd } = ref;
  if (toStart.id === toEnd.id) return `${toStart.book} ${toStart.chapter}:${toStart.verse}`;
  if (toStart.chapter === toEnd.chapter) return `${toStart.book} ${toStart.chapter}:${toStart.verse}-${toEnd.verse}`;
  return `${toStart.book} ${toStart.chapter}:${toStart.verse}-${toEnd.chapter}:${toEnd.verse}`;
}

export function CrossReferencePanel({ verse, onNavigate }: Props) {
  const [crossRefs, setCrossRefs] = useState<CrossReference[] | null>(null);
  const [matches, setMatches] = useState<SemanticMatch[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setCrossRefs(null);
    setMatches(null);
    getCrossReferences(verse.id).then(setCrossRefs);
    getSemanticMatches(verse.id).then(setMatches);
  }, [verse.id]);

  function handleNavigate(book: string, chapter: number, v: number) {
    setExpanded(false);
    onNavigate(book, chapter, v);
  }

  return (
    <motion.aside
      className="cross-ref-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="selected-verse-card">
        <div className="selected-verse-ref">
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
        <p className="selected-verse-text">{verse.text}</p>
        <MemorizeToggle verse={verse} />
      </div>

      {crossRefs && matches && (crossRefs.length > 0 || matches.length > 0) && (
        <RadialGraph verse={verse} crossRefs={crossRefs} matches={matches} onNavigate={onNavigate} onExpand={() => setExpanded(true)} />
      )}

      {expanded && crossRefs && matches && (
        <RadialGraphModal
          verse={verse}
          crossRefs={crossRefs}
          matches={matches}
          onNavigate={handleNavigate}
          onClose={() => setExpanded(false)}
        />
      )}

      <NotesSection verse={verse} />

      <StudyQA verse={verse} />

      <section className="ref-section">
        <h2>Cross References</h2>
        {crossRefs === null && <p className="loading">Loading…</p>}
        {crossRefs?.length === 0 && <p className="empty">None found.</p>}
        <ul className="ref-list">
          {crossRefs?.map((ref) => (
            <li key={ref.id}>
              <button className="ref-item" onClick={() => onNavigate(ref.toStart.book, ref.toStart.chapter, ref.toStart.verse)}>
                <span className="ref-label">{refLabel(ref)}</span>
                <span className="ref-snippet">{ref.toStart.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="ref-section">
        <h2>Semantically Related</h2>
        {matches === null && <p className="loading">Loading…</p>}
        {matches?.length === 0 && <p className="empty">None found.</p>}
        <ul className="ref-list">
          {matches?.map((m) => (
            <li key={m.id}>
              <button className="ref-item" onClick={() => onNavigate(m.book, m.chapter, m.verse)}>
                <span className="ref-label">
                  {m.book} {m.chapter}:{m.verse}
                  <span className="similarity"> {Math.round(m.similarity * 100)}%</span>
                </span>
                <span className="ref-snippet">{m.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </motion.aside>
  );
}
