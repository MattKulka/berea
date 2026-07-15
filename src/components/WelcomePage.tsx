import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ThemeToggle } from "./ThemeToggle";

export function WelcomePage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "confirm" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/read/John/1" replace />;

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
      navigate("/read/John/1");
    }
  }

  return (
    <div className="welcome-page">
      <div className="welcome-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="welcome-card">
        <img src="/favicon.svg" alt="" className="welcome-icon" />
        <h1 className="welcome-brand">Berea</h1>
        <p className="welcome-tagline">
          "...they searched the Scriptures daily, whether those things were so." — Acts 17:11
        </p>

        {status === "confirm" ? (
          <p className="auth-sent">Check your email to confirm your account, then sign in below.</p>
        ) : (
          <form className="welcome-form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            {status === "error" && <p className="auth-error">{errorMsg}</p>}
            <button
              type="button"
              className="welcome-mode-toggle"
              onClick={() => {
                setMode((m) => (m === "signin" ? "signup" : "signin"));
                setStatus("idle");
              }}
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        )}

        <div className="welcome-divider">
          <span>or</span>
        </div>

        <button className="welcome-guest-btn" onClick={() => navigate("/read/John/1")}>
          Continue as guest →
        </button>
      </div>
    </div>
  );
}
