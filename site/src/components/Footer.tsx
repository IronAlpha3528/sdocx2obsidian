import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer" aria-label="Page Footer">
      <div className="section-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
              <div className="brand-icon-wrapper" style={{ width: "28px", height: "28px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <span className="brand-name" style={{ fontSize: "1.05rem" }}>sdocx2obsidian</span>
            </Link>
            <p className="footer-tagline">
              Open-source client-side utility converting modern Samsung Notes (.sdocx) into Obsidian-ready Markdown vaults. Runs 100% in browser WebAssembly.
            </p>
          </div>

          <div className="footer-links-group">
            <div>
              <h4 className="footer-column-title">Pages</h4>
              <ul className="footer-links-list">
                <li>
                  <Link to="/" className="footer-link">
                    Converter Workbench
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="footer-link">
                    Features &amp; Architecture
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="footer-link">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/preview" className="footer-link">
                    Vault Preview
                  </Link>
                </li>
                <li>
                  <Link to="/limitations" className="footer-link">
                    Supported &amp; Limitations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">Project &amp; Source</h4>
              <ul className="footer-links-list">
                <li>
                  <a
                    href="https://github.com/IronAlpha3528/sdocx2obsidian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/IronAlpha3528/sdocx2obsidian/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    Report an Issue
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/IronAlpha3528/sdocx2obsidian/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    MIT License
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 sdocx2obsidian contributors. Open source under the MIT License.</span>
          <span>Unofficial utility. Not affiliated with Samsung Electronics or Obsidian.</span>
        </div>
      </div>
    </footer>
  );
};
