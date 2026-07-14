import { useState } from "react";
import { useAuth } from "../lib/auth";

export function AuthMenu() {
  const { user, loading, sendMagicLink, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (loading) return null;

  if (user) {
    return (
      <div className="auth-menu">
        <span className="auth-email">{user.email}</span>
        <button className="auth-link-btn" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await sendMagicLink(email);
    if (error) {
      setErrorMsg(error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="auth-menu">
      {!open && (
        <button className="auth-link-btn" onClick={() => setOpen(true)}>
          Sign in
        </button>
      )}
      {open && status !== "sent" && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {status === "error" && <span className="auth-error">{errorMsg}</span>}
        </form>
      )}
      {status === "sent" && <span className="auth-sent">Check your email for a sign-in link.</span>}
    </div>
  );
}
