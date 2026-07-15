import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../lib/auth";
import { createDeck, deleteDeck, listDecks, type Deck } from "../lib/decks";

export function MemorizePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [newDeckName, setNewDeckName] = useState("");

  useEffect(() => {
    if (user) listDecks().then(setDecks);
  }, [user]);

  if (loading) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim() || !user) return;
    const deck = await createDeck(user.id, newDeckName.trim());
    setDecks((prev) => [...(prev ?? []), deck]);
    setNewDeckName("");
  }

  async function handleDelete(deckId: number) {
    await deleteDeck(deckId);
    setDecks((prev) => prev!.filter((d) => d.id !== deckId));
  }

  return (
    <div className="app-shell">
      <AppHeader>
        <Link to="/read/John/1" className="auth-link-btn" style={{ marginLeft: "auto" }}>
          Back to reading
        </Link>
      </AppHeader>
      <main className="memorize-page">
        <h1 className="chapter-heading">Memorize</h1>
        {!user && <p className="empty">Sign in to build memorization decks.</p>}

        {user && decks === null && <p className="loading">Loading…</p>}
        {user && decks?.length === 0 && (
          <p className="empty">No decks yet — create one below, then add verses from any passage.</p>
        )}

        {user && decks && decks.length > 0 && (
          <ul className="deck-grid">
            {decks.map((deck) => (
              <li key={deck.id} className="deck-card">
                <button className="deck-card-body" onClick={() => navigate(`/memorize/${deck.id}`)}>
                  <span className="deck-card-name">{deck.name}</span>
                  <span className="deck-card-count">
                    {deck.cardCount} verse{deck.cardCount === 1 ? "" : "s"}
                  </span>
                </button>
                <button className="note-link-btn deck-card-delete" onClick={() => handleDelete(deck.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {user && (
          <form className="deck-create-form deck-create-form--page" onSubmit={handleCreate}>
            <input placeholder="New deck name" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} />
            <button type="submit" className="note-btn-primary" disabled={!newDeckName.trim()}>
              Create deck
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
