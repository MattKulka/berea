import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function AuthMenu() {
  const { user, loading, signOut } = useAuth();

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

  return (
    <Link to="/login" className="auth-link-btn">
      Sign In / Sign Up
    </Link>
  );
}
