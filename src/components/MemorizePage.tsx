import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { deckStats, listDeck, listDueCards, removeFromDeck, reviewCard, type MemoryCard } from "../lib/memory";

const GRADES: { label: string; quality: number; className: string }[] = [
  { label: "Again", quality: 1, className: "grade-again" },
  { label: "Hard", quality: 3, className: "grade-hard" },
  { label: "Good", quality: 4, className: "grade-good" },
  { label: "Easy", quality: 5, className: "grade-easy" },
];

function formatDue(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const days = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export function MemorizePage() {
  const { user, loading } = useAuth();
  const [queue, setQueue] = useState<MemoryCard[] | null>(null);
  const [deck, setDeck] = useState<MemoryCard[] | null>(null);
  const [stats, setStats] = useState<{ total: number; due: number } | null>(null);
  const [revealed, setRevealed] = useState(false);

  function refreshAll() {
    listDueCards().then(setQueue);
    listDeck().then(setDeck);
    deckStats().then(setStats);
  }

  useEffect(() => {
    if (!user) return;
    refreshAll();
  }, [user]);

  if (loading) return null;

  const current = queue?.[0] ?? null;

  async function grade(quality: number) {
    if (!current) return;
    await reviewCard(current, quality);
    setQueue((prev) => prev!.slice(1));
    setRevealed(false);
    listDeck().then(setDeck);
    deckStats().then(setStats);
  }

  async function handleRemove(cardId: number) {
    await removeFromDeck(cardId);
    setDeck((prev) => prev!.filter((c) => c.id !== cardId));
    setQueue((prev) => prev?.filter((c) => c.id !== cardId) ?? prev);
    deckStats().then(setStats);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/read/John/1" className="brand">
          Berea
        </Link>
        <Link to="/read/John/1" className="auth-link-btn" style={{ marginLeft: "auto" }}>
          Back to reading
        </Link>
      </header>
      <main className="memorize-page">
        <h1 className="chapter-heading">Memorize</h1>
        {!user && <p className="empty">Sign in to build a memorization deck.</p>}

        {user && stats && (
          <p className="memorize-stats">
            {stats.due} due today · {stats.total} total in deck
          </p>
        )}

        {user && queue === null && <p className="loading">Loading…</p>}

        {user && queue !== null && !current && (
          <p className="empty">Nothing due right now — add more verses from any passage, or come back later.</p>
        )}

        {current && (
          <div className="flashcard">
            <div className="flashcard-ref">
              {current.verse.book} {current.verse.chapter}:{current.verse.verse}
            </div>
            {revealed ? (
              <p className="flashcard-text">{current.verse.text}</p>
            ) : (
              <button className="note-btn-primary" onClick={() => setRevealed(true)}>
                Reveal
              </button>
            )}
            {revealed && (
              <div className="flashcard-grades">
                {GRADES.map((g) => (
                  <button key={g.label} className={`grade-btn ${g.className}`} onClick={() => grade(g.quality)}>
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {user && deck !== null && deck.length > 0 && (
          <section className="deck-list-section">
            <h2>Your Deck</h2>
            <ul className="deck-list">
              {deck.map((card) => (
                <li key={card.id} className="deck-item">
                  <span className="deck-item-ref">
                    {card.verse.book} {card.verse.chapter}:{card.verse.verse}
                  </span>
                  <span className="deck-item-due">{formatDue(card.dueAt)}</span>
                  <button className="note-link-btn" onClick={() => handleRemove(card.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
