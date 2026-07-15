import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../lib/auth";
import { getDeck, type Deck } from "../lib/decks";
import { listCardsInDeck, removeCard, type MemoryCard } from "../lib/memory";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function DeckStudyPage() {
  const { user, loading } = useAuth();
  const { deckId = "" } = useParams();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<MemoryCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDeck(Number(deckId)).then(setDeck);
    listCardsInDeck(Number(deckId)).then(setCards);
  }, [user, deckId]);

  if (loading) return null;

  const current = cards?.[index] ?? null;

  function goTo(newIndex: number) {
    if (!cards || cards.length === 0) return;
    const wrapped = ((newIndex % cards.length) + cards.length) % cards.length;
    setIndex(wrapped);
    setRevealed(false);
  }

  function handleShuffle() {
    setCards((prev) => (prev ? shuffle(prev) : prev));
    setIndex(0);
    setRevealed(false);
  }

  async function handleRemove() {
    if (!current) return;
    await removeCard(current.id);
    setCards((prev) => {
      const next = prev!.filter((c) => c.id !== current.id);
      return next;
    });
    setIndex((i) => (i > 0 ? i - 1 : 0));
    setRevealed(false);
  }

  return (
    <div className="app-shell">
      <AppHeader>
        <Link to="/memorize" className="auth-link-btn" style={{ marginLeft: "auto" }}>
          All decks
        </Link>
      </AppHeader>
      <main className="memorize-page">
        <h1 className="chapter-heading">{deck?.name ?? "Deck"}</h1>

        {!user && <p className="empty">Sign in to study your decks.</p>}
        {user && cards === null && <p className="loading">Loading…</p>}
        {user && cards?.length === 0 && <p className="empty">This deck is empty — add verses from any passage.</p>}

        {current && cards && cards.length > 0 && (
          <>
            <p className="memorize-stats">
              Card {index + 1} of {cards.length}
            </p>
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
              <div className="flashcard-nav">
                <button className="note-btn-secondary" onClick={() => goTo(index - 1)}>
                  ‹ Previous
                </button>
                <button className="note-btn-secondary" onClick={() => goTo(index + 1)}>
                  Next ›
                </button>
              </div>
            </div>
            <div className="flashcard-tools">
              <button className="note-link-btn" onClick={handleShuffle}>
                Shuffle deck
              </button>
              <button className="note-link-btn" onClick={handleRemove}>
                Remove this verse from deck
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
