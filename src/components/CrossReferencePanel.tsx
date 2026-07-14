import { useEffect, useState } from "react";
import { getCrossReferences, getSemanticMatches } from "../lib/queries";
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

  useEffect(() => {
    setCrossRefs(null);
    setMatches(null);
    getCrossReferences(verse.id).then(setCrossRefs);
    getSemanticMatches(verse.id).then(setMatches);
  }, [verse.id]);

  return (
    <aside className="cross-ref-panel">
      <div className="selected-verse-card">
        <div className="selected-verse-ref">
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
        <p className="selected-verse-text">{verse.text}</p>
      </div>

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
    </aside>
  );
}
