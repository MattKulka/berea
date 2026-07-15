import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { decksContainingVerse } from "../lib/memory";
import { AddToDeckModal } from "./AddToDeckModal";
import type { Verse } from "../lib/types";

export function MemorizeToggle({ verse }: { verse: Verse }) {
  const { user } = useAuth();
  const [deckCount, setDeckCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    decksContainingVerse(verse.id).then((set) => setDeckCount(set.size));
  }, [user, verse.id, open]);

  if (!user) return null;

  return (
    <>
      <button className={"memorize-btn" + (deckCount > 0 ? " in-deck" : "")} onClick={() => setOpen(true)}>
        {deckCount > 0 ? `✓ In ${deckCount} deck${deckCount > 1 ? "s" : ""}` : "+ Add to memorization deck"}
      </button>
      {open && <AddToDeckModal verse={verse} onClose={() => setOpen(false)} />}
    </>
  );
}
