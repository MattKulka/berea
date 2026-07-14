import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { addToDeck, isInDeck, removeFromDeck } from "../lib/memory";
import type { Verse } from "../lib/types";

export function MemorizeToggle({ verse }: { verse: Verse }) {
  const { user } = useAuth();
  const [cardId, setCardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    isInDeck(user.id, verse.id).then(setCardId);
  }, [user, verse.id]);

  if (!user) return null;

  async function toggle() {
    setLoading(true);
    try {
      if (cardId) {
        await removeFromDeck(cardId);
        setCardId(null);
      } else {
        const id = await addToDeck(user!.id, verse.id);
        setCardId(id);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className={"memorize-btn" + (cardId ? " in-deck" : "")} onClick={toggle} disabled={loading}>
      {cardId ? "✓ In memorization deck" : "+ Memorize this verse"}
    </button>
  );
}
