import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../lib/auth";
import { listAllNotes } from "../lib/notes";
import type { Note } from "../lib/types";

export function NotesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    if (user) listAllNotes().then(setNotes);
  }, [user]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes?.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filtered = activeTag ? notes?.filter((n) => n.tags.includes(activeTag)) : notes;

  if (loading) return null;

  return (
    <div className="app-shell">
      <AppHeader>
        <Link to="/read/John/1" className="auth-link-btn" style={{ marginLeft: "auto" }}>
          Back to reading
        </Link>
      </AppHeader>
      <main className="notes-page">
        <h1 className="chapter-heading">My Notes</h1>
        {!user && <p className="empty">Sign in to see your notes.</p>}
        {user && notes === null && <p className="loading">Loading…</p>}
        {user && notes?.length === 0 && <p className="empty">No notes yet — add one from any verse.</p>}

        {allTags.length > 0 && (
          <div className="note-tags note-filter-tags">
            <button className={"note-tag-filter" + (activeTag === null ? " active" : "")} onClick={() => setActiveTag(null)}>
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                className={"note-tag-filter" + (activeTag === t ? " active" : "")}
                onClick={() => setActiveTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <ul className="notes-page-list">
          {filtered?.map((note) => (
            <li key={note.id} className="notes-page-item">
              <button
                className="notes-page-ref"
                onClick={() =>
                  navigate(`/read/${encodeURIComponent(note.verseStart.book)}/${note.verseStart.chapter}?v=${note.verseStart.verse}`)
                }
              >
                {note.verseStart.book} {note.verseStart.chapter}:{note.verseStart.verse}
              </button>
              <p className="notes-page-verse-text">{note.verseStart.text}</p>
              <p className="note-body">{note.body}</p>
              {note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.map((t) => (
                    <span key={t} className="note-tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
