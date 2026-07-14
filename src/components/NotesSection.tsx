import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { createNote, deleteNote, listNotesForVerse, updateNote } from "../lib/notes";
import type { Note, Verse } from "../lib/types";

function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function NoteEditor({
  initialBody = "",
  initialTags = "",
  onSave,
  onCancel,
  saveLabel,
}: {
  initialBody?: string;
  initialTags?: string;
  onSave: (body: string, tags: string[]) => void;
  onCancel?: () => void;
  saveLabel: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [tags, setTags] = useState(initialTags);

  return (
    <div className="note-editor">
      <textarea placeholder="Write a note…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
      <input placeholder="tags, comma, separated" value={tags} onChange={(e) => setTags(e.target.value)} />
      <div className="note-editor-actions">
        {onCancel && (
          <button className="note-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="note-btn-primary"
          disabled={!body.trim()}
          onClick={() => onSave(body.trim(), parseTags(tags))}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

export function NotesSection({ verse }: { verse: Verse }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setNotes(null);
    listNotesForVerse(verse.id).then(setNotes);
  }, [verse.id, user]);

  if (!user) {
    return (
      <section className="ref-section">
        <h2>Notes</h2>
        <p className="empty">Sign in to add notes and tags to this verse.</p>
      </section>
    );
  }

  async function handleAdd(body: string, tags: string[]) {
    const note = await createNote(user!.id, verse.id, body, tags);
    setNotes((prev) => [note, ...(prev ?? [])]);
    setAdding(false);
  }

  async function handleUpdate(id: number, body: string, tags: string[]) {
    await updateNote(id, body, tags);
    setNotes((prev) => prev!.map((n) => (n.id === id ? { ...n, body, tags } : n)));
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    await deleteNote(id);
    setNotes((prev) => prev!.filter((n) => n.id !== id));
  }

  return (
    <section className="ref-section">
      <h2>Notes</h2>
      {notes === null && <p className="loading">Loading…</p>}
      <ul className="note-list">
        {notes?.map((note) =>
          editingId === note.id ? (
            <li key={note.id}>
              <NoteEditor
                initialBody={note.body}
                initialTags={note.tags.join(", ")}
                onSave={(body, tags) => handleUpdate(note.id, body, tags)}
                onCancel={() => setEditingId(null)}
                saveLabel="Save"
              />
            </li>
          ) : (
            <li key={note.id} className="note-item">
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
              <div className="note-item-actions">
                <button className="note-link-btn" onClick={() => setEditingId(note.id)}>
                  Edit
                </button>
                <button className="note-link-btn" onClick={() => handleDelete(note.id)}>
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {adding ? (
        <NoteEditor onSave={handleAdd} onCancel={() => setAdding(false)} saveLabel="Add note" />
      ) : (
        <button className="note-link-btn" onClick={() => setAdding(true)}>
          + Add a note
        </button>
      )}
    </section>
  );
}
