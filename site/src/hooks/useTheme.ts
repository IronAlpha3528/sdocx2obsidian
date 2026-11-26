import { useState, useEffect } from "react";
import { ThemeMode } from "../types";

export function useTheme(): { theme: ThemeMode; toggleTheme: () => void } {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("sdocx2obsidian_theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("sdocx2obsidian_theme", next);
      return next;
    });
  };

  return { theme, toggleTheme };
}
