import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AuthMenu } from "./AuthMenu";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="app-header">
      <Link to="/read/John/1" className="brand">
        Berea
      </Link>
      {children}
      <ThemeToggle />
      <AuthMenu />
    </header>
  );
}
