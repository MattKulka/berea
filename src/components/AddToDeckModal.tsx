import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth";
import { addCardToDeck, decksContainingVerse, removeCardFromDeck } from "../lib/memory";
import { createDeck, listDecks, type Deck } from "../lib/decks";
import type { Verse } from "../lib/types";

export function AddToDeckModal({ verse, onClose }: { verse: Verse; onClose: () => void }) {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [memberOf, setMemberOf] = useState<Set<number>>(new Set());
  const [newDeckName, setNewDeckName] = useState("");

  useEffect(() => {
    if (!user) return;
    listDecks().then(setDecks);
    decksContainingVerse(verse.id).then(setMemberOf);
  }, [user, verse.id]);

  async function toggle(deckId: number) {
    if (!user) return;
    if (memberOf.has(deckId)) {
      await removeCardFromDeck(deckId, verse.id);
      setMemberOf((prev) => {
        const next = new Set(prev);
        next.delete(deckId);
        return next;
      });
    } else {
      await addCardToDeck(user.id, deckId, verse.id);
      setMemberOf((prev) => new Set(prev).add(deckId));
    }
  }

  async function handleCreateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim() || !user) return;
    const deck = await createDeck(user.id, newDeckName.trim());
    await addCardToDeck(user.id, deck.id, verse.id);
    setDecks((prev) => [...(prev ?? []), deck]);
    setMemberOf((prev) => new Set(prev).add(deck.id));
    setNewDeckName("");
  }

  return (
    <AnimatePresence>
      <motion.div className="radial-modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="deck-modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2 }}
        >
          <button className="radial-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <h2>Add to deck</h2>
          <p className="deck-modal-verse">
            {verse.book} {verse.chapter}:{verse.verse}
          </p>

          {decks === null && <p className="loading">Loading…</p>}
          {decks?.length === 0 && <p className="empty">You don't have any decks yet — create one below.</p>}
          <ul className="deck-modal-list">
            {decks?.map((deck) => (
              <li key={deck.id}>
                <label className="deck-checkbox-row">
                  <input type="checkbox" checked={memberOf.has(deck.id)} onChange={() => toggle(deck.id)} />
                  {deck.name}
                </label>
              </li>
            ))}
          </ul>

          <form className="deck-create-form" onSubmit={handleCreateDeck}>
            <input placeholder="New deck name" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} />
            <button type="submit" className="note-btn-primary" disabled={!newDeckName.trim()}>
              Create
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
