import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, getSystemTheme, type Theme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
