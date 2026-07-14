import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadialGraph } from "./RadialGraph";
import type { CrossReference, SemanticMatch, Verse } from "../lib/types";

export function RadialGraphModal({
  verse,
  crossRefs,
  matches,
  onNavigate,
  onClose,
}: {
  verse: Verse;
  crossRefs: CrossReference[];
  matches: SemanticMatch[];
  onNavigate: (book: string, chapter: number, verse: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div className="radial-modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="radial-modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <button className="radial-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <RadialGraph verse={verse} crossRefs={crossRefs} matches={matches} onNavigate={onNavigate} variant="expanded" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
