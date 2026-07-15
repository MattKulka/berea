import { useState } from "react";
import { useAuth } from "../lib/auth";

export function AuthMenu() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "confirm" | "error">("idle");
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
    setStatus("submitting");
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else if (result.needsEmailConfirmation) {
      setStatus("confirm");
    } else {
      setStatus("idle");
    }
  }

  return (
    <div className="auth-menu">
      {!open && (
        <button className="auth-link-btn" onClick={() => setOpen(true)}>
          Sign in
        </button>
      )}
      {open && status !== "confirm" && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
          <button
            type="button"
            className="auth-mode-toggle"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setStatus("idle");
            }}
          >
            {mode === "signin" ? "Need an account?" : "Have an account?"}
          </button>
          {status === "error" && <span className="auth-error">{errorMsg}</span>}
        </form>
      )}
      {status === "confirm" && <span className="auth-sent">Check your email to confirm your account, then sign in.</span>}
    </div>
  );
}
