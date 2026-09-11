"use client";

import { useEffect, type ReactNode } from "react";
import { oppositeTheme, PAPER, THEME_STORAGE_KEY, type Theme, isTheme } from "@/lib/theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

function activeTheme(): Theme {
  const stored = document.documentElement.dataset.theme;
  if (isTheme(stored)) return stored;
  return systemTheme();
}

function applyThemeColor(theme: Theme) {
  const color = PAPER[theme];
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((meta, index) => {
    if (index === 0) {
      meta.setAttribute("content", color);
      meta.removeAttribute("media");
      return;
    }
    meta.remove();
  });
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" className="theme-icon">
      {children}
    </svg>
  );
}

export function ThemeToggle() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (document.documentElement.dataset.theme) return;
      applyThemeColor(systemTheme());
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function switchTheme() {
    const next = oppositeTheme(activeTheme());
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) root.classList.add("theme-swap");
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing can reject storage. The choice still applies for this page.
    }
    applyThemeColor(next);
    window.setTimeout(() => root.classList.remove("theme-swap"), 220);
  }

  return (
    <button type="button" className="theme-toggle" onClick={switchTheme}>
      <span className="theme-face theme-face-day">
        <Icon>
          <circle cx="12" cy="12" r="3.25" />
          <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18" />
        </Icon>
        <span className="theme-word">Day</span>
        <span className="sr-only"> mode</span>
      </span>
      <span className="theme-face theme-face-night">
        <Icon>
          <path d="M20.2 14.6A8.1 8.1 0 0 1 9.4 3.6 7.15 7.15 0 1 0 20.2 14.6z" />
        </Icon>
        <span className="theme-word">Night</span>
        <span className="sr-only"> mode</span>
      </span>
    </button>
  );
}
