import { useState } from "react";
import type { Verse } from "../lib/types";

type Props = { verse: Verse };

export function StudyQA({ verse }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: verse.book, chapter: verse.chapter, verse: verse.verse, question }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setAnswer(data.answer);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="ref-section study-qa">
      <h2>Ask About This Passage</h2>
      <form onSubmit={handleSubmit} className="qa-form">
        <textarea
          placeholder="What does this mean? (leave blank for a general study note)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Thinking…" : "Ask"}
        </button>
      </form>
      {status === "error" && <p className="empty">Something went wrong. Try again.</p>}
      {answer && <p className="qa-answer">{answer}</p>}
    </section>
  );
}
