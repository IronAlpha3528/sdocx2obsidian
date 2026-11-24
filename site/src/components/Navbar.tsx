import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ThemeMode } from "../types";

interface NavbarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="site-navbar" aria-label="Main Navigation">
      <div className="section-container navbar-inner">
        <Link to="/" className="brand-link" aria-label="sdocx2obsidian homepage">
          <div className="brand-icon-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="brand-name">sdocx2obsidian</span>
        </Link>

        <ul className="navbar-nav">
          <li>
            <NavLink
              to="/features"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              style={({ isActive }) =>
                isActive ? { color: "var(--accent-base)", fontWeight: 600 } : undefined
              }
            >
              Features
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/how-it-works"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              style={({ isActive }) =>
                isActive ? { color: "var(--accent-base)", fontWeight: 600 } : undefined
              }
            >
              How It Works
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/preview"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              style={({ isActive }) =>
                isActive ? { color: "var(--accent-base)", fontWeight: 600 } : undefined
              }
            >
              Preview
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/limitations"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              style={({ isActive }) =>
                isActive ? { color: "var(--accent-base)", fontWeight: 600 } : undefined
              }
            >
              Limitations
            </NavLink>
          </li>
        </ul>

        <div className="navbar-actions">
          {!isHome && (
            <Link
              to="/"
              className="btn-secondary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
            >
              Converter
            </Link>
          )}

          <a
            href="https://github.com/IronAlpha3528/sdocx2obsidian"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            aria-label="View source repository on GitHub"
            title="GitHub Repository"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};
