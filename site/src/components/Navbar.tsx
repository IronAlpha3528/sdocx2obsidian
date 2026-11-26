import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ThemeMode } from "../types";

interface NavbarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-navbar" aria-label="Main Navigation">
      <div className="navbar-inner">
        <Link to="/" className="brand-wordmark" aria-label="sdocx2obsidian homepage">
          <svg
            className="brand-logo"
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="navTileBg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2b313d" />
                <stop offset="100%" stopColor="#171b22" />
              </linearGradient>
              <linearGradient id="navSheetBg" x1="8" y1="6" x2="23" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2b3341" />
                <stop offset="100%" stopColor="#1e242f" />
              </linearGradient>
              <linearGradient id="navFoldBlue" x1="18.5" y1="6" x2="23.5" y2="11" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="navGemHighlight" x1="14" y1="12" x2="18" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ddd6fe" />
                <stop offset="55%" stopColor="#a882ff" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="navGemShadow" x1="12" y1="14" x2="17" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
            </defs>
            <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="url(#navTileBg)" stroke="#3b4354" strokeWidth="1" />
            <path
              d="M9.5 6.5H18.5L23.2 11.2V24.2C23.2 24.92 22.62 25.5 21.9 25.5H9.5C8.78 25.5 8.2 24.92 8.2 24.2V7.8C8.2 7.08 8.78 6.5 9.5 6.5Z"
              fill="url(#navSheetBg)"
              stroke="#475569"
              strokeWidth="0.9"
            />
            <path d="M18.5 6.5V10.1C18.5 10.71 18.99 11.2 19.6 11.2H23.2L18.5 6.5Z" fill="url(#navFoldBlue)" />
            <polygon points="16.5,11.6 13.3,14.2 14.5,17.2 16.5,14.6" fill="#c4b5fd" />
            <polygon points="16.5,11.6 16.5,14.6 19.4,15.3 18.7,12.5" fill="#e9d5ff" />
            <polygon points="13.3,14.2 11.8,18.2 13.7,22.2 14.5,17.2" fill="url(#navGemShadow)" />
            <polygon points="16.5,14.6 14.5,17.2 16.9,22.8 19.4,15.3" fill="url(#navGemHighlight)" />
            <polygon points="14.5,17.2 13.7,22.2 16.9,22.8" fill="#5b21b6" />
            <polygon points="19.4,15.3 16.9,22.8 18.9,19.4" fill="#8b5cf6" />
          </svg>
          <span>sdocx2obsidian</span>
        </Link>

        <nav aria-label="Site Links">
          <ul className="navbar-nav">
            <li>
              <NavLink
                to="/features"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Features
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/how-it-works"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                How It Works
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/preview"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Preview
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/limitations"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Limitations
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="navbar-actions">
          {!isHome && (
            <Link
              to="/"
              className="btn-secondary navbar-converter-link"
              style={{ padding: "4px 10px", fontSize: "0.8rem" }}
            >
              Converter
            </Link>
          )}

          <a
            href="https://github.com/IronAlpha3528/sdocx2obsidian"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button"
            aria-label="GitHub Repository"
            title="GitHub Repository"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          <button
            type="button"
            className="icon-button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="icon-button mobile-nav-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav-menu" aria-label="Mobile Navigation">
          {!isHome && (
            <NavLink to="/" end className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}>
              Converter
            </NavLink>
          )}
          <NavLink to="/features" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}>
            Features
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}>
            How It Works
          </NavLink>
          <NavLink to="/preview" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}>
            Preview
          </NavLink>
          <NavLink to="/limitations" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}>
            Limitations
          </NavLink>
        </nav>
      )}
    </header>
  );
};
